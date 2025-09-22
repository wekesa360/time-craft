// Real-Time API Endpoints
// Handles SSE connections, real-time calendar sync, and live updates

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../lib/env';
import { DatabaseService } from '../lib/db';
import { createSSEResponse, sseService, SSE_EVENT_TYPES } from '../lib/realtime-sse';
import { RealtimeCalendarService } from '../lib/realtime-calendar';

const realtime = new Hono<{ Bindings: Env }>();

// Helper function to get user from token
async function getUserFromToken(c: any) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    return { userId: payload.userId, email: payload.email };
  } catch (error) {
    return null;
  }
}

// ========== SSE CONNECTIONS ==========

// GET /realtime/sse - Establish SSE connection
realtime.get('/sse', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Subscribe to common event types
  const connectionId = c.req.header('X-Connection-ID');
  if (connectionId) {
    sseService.subscribe(connectionId, [
      SSE_EVENT_TYPES.CALENDAR_EVENT_CREATED,
      SSE_EVENT_TYPES.CALENDAR_EVENT_UPDATED,
      SSE_EVENT_TYPES.CALENDAR_EVENT_DELETED,
      SSE_EVENT_TYPES.TASK_CREATED,
      SSE_EVENT_TYPES.TASK_UPDATED,
      SSE_EVENT_TYPES.TASK_COMPLETED,
      SSE_EVENT_TYPES.FOCUS_SESSION_STARTED,
      SSE_EVENT_TYPES.FOCUS_SESSION_COMPLETED,
      SSE_EVENT_TYPES.NOTIFICATION_RECEIVED
    ]);
  }

  return createSSEResponse(auth.userId);
});

// POST /realtime/sse/subscribe - Subscribe to specific event types
realtime.post('/sse/subscribe', 
  zValidator('json', z.object({
    connectionId: z.string(),
    eventTypes: z.array(z.string())
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { connectionId, eventTypes } = c.req.valid('json');
    
    const success = sseService.subscribe(connectionId, eventTypes);
    
    return c.json({ 
      success,
      message: success ? 'Subscribed successfully' : 'Subscription failed'
    });
  }
);

// POST /realtime/sse/unsubscribe - Unsubscribe from event types
realtime.post('/sse/unsubscribe',
  zValidator('json', z.object({
    connectionId: z.string(),
    eventTypes: z.array(z.string())
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { connectionId, eventTypes } = c.req.valid('json');
    
    const success = sseService.unsubscribe(connectionId, eventTypes);
    
    return c.json({ 
      success,
      message: success ? 'Unsubscribed successfully' : 'Unsubscription failed'
    });
  }
);

// GET /realtime/sse/stats - Get SSE connection statistics
realtime.get('/sse/stats', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const stats = sseService.getStats();
  
  return c.json(stats);
});

// ========== REAL-TIME CALENDAR SYNC ==========

// POST /realtime/calendar/sync - Start calendar synchronization
realtime.post('/calendar/sync',
  zValidator('json', z.object({
    provider: z.enum(['google', 'outlook', 'apple'])
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { provider } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const calendarService = new RealtimeCalendarService(db);

    try {
      // Start sync in background
      calendarService.startRealtimeSync(auth.userId, provider);
      
      return c.json({
        success: true,
        message: `Calendar sync started for ${provider}`,
        provider
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }, 500);
    }
  }
);

// GET /realtime/calendar/sync/status - Get sync status
realtime.get('/calendar/sync/status', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);
  const calendarService = new RealtimeCalendarService(db);
  
  const statuses = calendarService.getSyncStatus(auth.userId);
  
  return c.json({ statuses });
});

// POST /realtime/calendar/conflicts/resolve - Resolve calendar conflict
realtime.post('/calendar/conflicts/resolve',
  zValidator('json', z.object({
    conflictId: z.string(),
    resolution: z.enum(['local_wins', 'remote_wins', 'manual'])
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { conflictId, resolution } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const calendarService = new RealtimeCalendarService(db);

    try {
      await calendarService.resolveConflict(conflictId, resolution);
      
      return c.json({
        success: true,
        message: 'Conflict resolved successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Resolution failed'
      }, 500);
    }
  }
);

// POST /realtime/calendar/events/recurring - Create recurring event
realtime.post('/calendar/events/recurring',
  zValidator('json', z.object({
    title: z.string(),
    description: z.string().optional(),
    startTime: z.number(),
    endTime: z.number(),
    location: z.string().optional(),
    recurrence: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
      interval: z.number(),
      endDate: z.number().optional(),
      count: z.number().optional(),
      daysOfWeek: z.array(z.number()).optional(),
      dayOfMonth: z.number().optional()
    })
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const eventData = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const calendarService = new RealtimeCalendarService(db);

    try {
      const eventId = await calendarService.createRecurringEvent(auth.userId, eventData);
      
      return c.json({
        success: true,
        eventId,
        message: 'Recurring event created successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Event creation failed'
      }, 500);
    }
  }
);

// ========== REAL-TIME NOTIFICATIONS ==========

// POST /realtime/notifications/send - Send real-time notification
realtime.post('/notifications/send',
  zValidator('json', z.object({
    userId: z.string(),
    title: z.string(),
    body: z.string(),
    data: z.record(z.any()).optional(),
    type: z.enum(['task_reminder', 'achievement', 'focus_session', 'health_reminder', 'general']),
    platform: z.enum(['ios', 'android', 'web']).optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notification = c.req.valid('json');
    
    // Send via SSE
    const sentCount = sseService.sendToUser(notification.userId, {
      type: SSE_EVENT_TYPES.NOTIFICATION_RECEIVED,
      data: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        type: notification.type,
        timestamp: Date.now()
      }
    });
    
    return c.json({
      success: true,
      sentCount,
      message: `Notification sent to ${sentCount} connection(s)`
    });
  }
);

// ========== REAL-TIME TASKS ==========

// POST /realtime/tasks/create - Create task with real-time notification
realtime.post('/tasks/create',
  zValidator('json', z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.number().optional(),
    category: z.string().optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskData = c.req.valid('json');
    const db = new DatabaseService(c.env);
    
    try {
      // Create task
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.execute(`
        INSERT INTO tasks (
          id, user_id, title, description, priority, due_date, category,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        taskId,
        auth.userId,
        taskData.title,
        taskData.description || '',
        taskData.priority || 'medium',
        taskData.dueDate || null,
        taskData.category || null,
        'pending',
        Date.now(),
        Date.now()
      ]);

      // Send real-time notification
      sseService.sendToUser(auth.userId, {
        type: SSE_EVENT_TYPES.TASK_CREATED,
        data: {
          taskId,
          title: taskData.title,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          timestamp: Date.now()
        }
      });
      
      return c.json({
        success: true,
        taskId,
        message: 'Task created successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Task creation failed'
      }, 500);
    }
  }
);

// ========== REAL-TIME FOCUS SESSIONS ==========

// POST /realtime/focus/start - Start focus session with real-time updates
realtime.post('/focus/start',
  zValidator('json', z.object({
    duration: z.number().min(1).max(120), // 1-120 minutes
    type: z.enum(['pomodoro', 'deep_work', 'break']).optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { duration, type = 'pomodoro' } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create focus session
      await db.execute(`
        INSERT INTO focus_sessions (
          id, user_id, duration, type, status, started_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        sessionId,
        auth.userId,
        duration,
        type,
        'active',
        Date.now(),
        Date.now()
      ]);

      // Send real-time notification
      sseService.sendToUser(auth.userId, {
        type: SSE_EVENT_TYPES.FOCUS_SESSION_STARTED,
        data: {
          sessionId,
          duration,
          type,
          startedAt: Date.now()
        }
      });
      
      return c.json({
        success: true,
        sessionId,
        message: 'Focus session started',
        duration,
        type
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Session start failed'
      }, 500);
    }
  }
);

// POST /realtime/focus/complete - Complete focus session
realtime.post('/focus/complete',
  zValidator('json', z.object({
    sessionId: z.string()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { sessionId } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    
    try {
      // Update session status
      await db.execute(`
        UPDATE focus_sessions 
        SET status = 'completed', completed_at = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `, [Date.now(), Date.now(), sessionId, auth.userId]);

      // Send real-time notification
      sseService.sendToUser(auth.userId, {
        type: SSE_EVENT_TYPES.FOCUS_SESSION_COMPLETED,
        data: {
          sessionId,
          completedAt: Date.now()
        }
      });
      
      return c.json({
        success: true,
        message: 'Focus session completed'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Session completion failed'
      }, 500);
    }
  }
);

export default realtime;