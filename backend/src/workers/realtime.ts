// Realtime WebSocket Worker for Time & Wellness Application
import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/cloudflare-workers';
import { verify } from 'hono/jwt';

import type { Env } from '../lib/env';
import { DatabaseService, UserRepository } from '../lib/db';
import type { SupportedLanguage } from '../types/database';

const realtime = new Hono<{ Bindings: Env }>();

// WebSocket connection registry using Durable Objects would be ideal
// For now we'll use a simple notification system with Server-Sent Events

// Types for realtime events
interface RealtimeEvent {
  type: 'task_updated' | 'health_log_added' | 'notification' | 'achievement_unlocked' | 'meeting_reminder';
  userId: string;
  data: any;
  timestamp: number;
}

interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  expiresAt?: number;
}

// Middleware to extract user from JWT
const getUserFromToken = async (c: any): Promise<{ userId: string; language?: SupportedLanguage } | null> => {
  try {
    // First try Authorization header
    let token = '';
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to query parameter for SSE connections
      token = c.req.query('token') || '';
    }

    if (!token) {
      return null;
    }

    const payload = await verify(token, c.env.JWT_SECRET);
    
    return { 
      userId: payload.userId as string,
      language: (payload.preferredLanguage as SupportedLanguage) || 'en'
    };
  } catch {
    return null;
  }
};

// ========== SERVER-SENT EVENTS ==========

// GET /realtime/events - Server-Sent Events endpoint
realtime.get('/events', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Set up Server-Sent Events headers
  return c.newResponse(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial connection event
        const initialData = `data: ${JSON.stringify({
          type: 'connection_established',
          userId: auth.userId,
          timestamp: Date.now()
        })}\n\n`;
        controller.enqueue(encoder.encode(initialData));

        // Set up periodic heartbeat (every 30 seconds)
        const heartbeatInterval = setInterval(() => {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now()
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        }, 30000);

        // In a real implementation, you would:
        // 1. Register this connection in a Durable Object
        // 2. Listen for events targeted at this user
        // 3. Stream those events through this connection
        
        // For now, we'll simulate with a cleanup timeout
        const cleanup = setTimeout(() => {
          clearInterval(heartbeatInterval);
          controller.close();
        }, 5 * 60 * 1000); // 5 minutes

        // Store cleanup functions (in real app, this would be in Durable Object)
        (c as any).cleanup = () => {
          clearInterval(heartbeatInterval);
          clearTimeout(cleanup);
          controller.close();
        };
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    }
  );
});

// ========== WEBSOCKET ENDPOINT ==========

// GET /realtime/ws - WebSocket upgrade endpoint
realtime.get('/ws', upgradeWebSocket(async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return {
    onOpen: (evt, ws) => {
      console.log(`WebSocket connected for user: ${auth.userId}`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection_established',
        userId: auth.userId,
        timestamp: Date.now()
      }));
    },

    onMessage: async (evt, ws) => {
      try {
        const message = JSON.parse(evt.data as string);
        
        switch (message.type) {
          case 'subscribe':
            // Subscribe to specific event types
            ws.send(JSON.stringify({
              type: 'subscribed',
              channels: message.channels || ['notifications', 'tasks', 'health'],
              timestamp: Date.now()
            }));
            break;

          case 'ping':
            // Respond to ping with pong
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: Date.now()
            }));
            break;

          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type',
              timestamp: Date.now()
            }));
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: Date.now()
        }));
      }
    },

    onClose: (evt, ws) => {
      console.log(`WebSocket disconnected for user: ${auth.userId}`);
    },

    onError: (evt, ws) => {
      console.error(`WebSocket error for user: ${auth.userId}:`, evt);
    }
  };
}));

// ========== NOTIFICATION SYSTEM ==========

// POST /realtime/notify - Send notification to user
realtime.post('/notify', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { title, message, type = 'info', actionUrl, expiresAt } = body;

    if (!title || !message) {
      return c.json({ error: 'Title and message are required' }, 400);
    }

    const notification: NotificationPayload = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      actionUrl,
      expiresAt: expiresAt || (Date.now() + 24 * 60 * 60 * 1000) // 24 hours default
    };

    // Store notification in database/cache for persistence
    await c.env.CACHE.put(
      `notification_${auth.userId}_${notification.id}`,
      JSON.stringify(notification),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    // In a real implementation, this would broadcast to all connected clients
    // For now, we'll track the notification was created
    
    return c.json({
      message: 'Notification queued successfully',
      notification: {
        id: notification.id,
        title: notification.title,
        type: notification.type
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Notification error:', error);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// GET /realtime/notifications - Get user's notifications
realtime.get('/notifications', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // In a real implementation, you'd query the database for notifications
    // For now, we'll return a placeholder response
    
    const notifications: NotificationPayload[] = [
      {
        id: 'sample_1',
        title: 'Welcome to Time Craft!',
        message: 'Start tracking your time and wellness activities',
        type: 'info',
        actionUrl: '/dashboard'
      },
      {
        id: 'sample_2', 
        title: 'Daily Health Check',
        message: 'Don\'t forget to log your wellness activities today',
        type: 'info',
        actionUrl: '/health'
      }
    ];

    return c.json({
      notifications: notifications.filter(n => 
        !n.expiresAt || n.expiresAt > Date.now()
      ),
      count: notifications.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// DELETE /realtime/notifications/:id - Mark notification as read/dismiss
realtime.delete('/notifications/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const notificationId = c.req.param('id');
    
    // Remove from cache/database
    await c.env.CACHE.delete(`notification_${auth.userId}_${notificationId}`);
    
    return c.json({
      message: 'Notification dismissed successfully',
      notificationId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ error: 'Failed to dismiss notification' }, 500);
  }
});

// ========== EVENT BROADCASTING ==========

// POST /realtime/broadcast - Internal endpoint for broadcasting events
realtime.post('/broadcast', async (c) => {
  // This would typically be called by other workers/services
  // Authentication should be service-to-service rather than user JWT
  
  try {
    const event: RealtimeEvent = await c.req.json();
    
    // Validate event structure
    if (!event.type || !event.userId || !event.data) {
      return c.json({ error: 'Invalid event structure' }, 400);
    }

    // In a real implementation:
    // 1. Find all connections for the target user
    // 2. Send the event to those connections
    // 3. Store the event for offline users
    
    // For now, we'll just log and acknowledge
    console.log('Broadcasting event:', event);
    
    // Store event for later retrieval
    const eventKey = `event_${event.userId}_${Date.now()}`;
    await c.env.CACHE.put(
      eventKey,
      JSON.stringify(event),
      { expirationTtl: 60 * 60 } // 1 hour
    );

    return c.json({
      message: 'Event broadcast queued',
      eventId: eventKey,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return c.json({ error: 'Failed to broadcast event' }, 500);
  }
});

// GET /realtime/events/history - Get recent events for user
realtime.get('/events/history', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // In a real implementation, you'd query stored events
    // For now, return placeholder data
    
    const sampleEvents: RealtimeEvent[] = [
      {
        type: 'task_updated',
        userId: auth.userId,
        data: {
          taskId: 'sample_task',
          status: 'completed',
          title: 'Sample Task'
        },
        timestamp: Date.now() - 300000 // 5 minutes ago
      },
      {
        type: 'achievement_unlocked',
        userId: auth.userId,
        data: {
          achievement: {
            id: 'first_week',
            name: 'First Week Complete',
            description: 'Completed your first week of tracking'
          }
        },
        timestamp: Date.now() - 600000 // 10 minutes ago
      }
    ];

    return c.json({
      events: sampleEvents,
      count: sampleEvents.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Events history error:', error);
    return c.json({ error: 'Failed to fetch event history' }, 500);
  }
});

// ========== HEALTH CHECKS ==========

// GET /realtime/health - Health check endpoint
realtime.get('/health', async (c) => {
  return c.json({
    status: 'healthy',
    service: 'realtime-worker',
    timestamp: Date.now(),
    uptime: process.uptime?.() || 'unknown',
    version: '1.0.0'
  });
});

// GET /realtime/stats - Connection and event statistics
realtime.get('/stats', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return c.json({
    connections: {
      active: 0, // Would be fetched from Durable Object registry
      total: 0
    },
    events: {
      sent: 0,
      received: 0,
      failed: 0
    },
    notifications: {
      pending: 0,
      delivered: 0
    },
    timestamp: Date.now()
  });
});

export default realtime;