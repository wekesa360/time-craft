// Focus Sessions Worker - API Endpoints for Pomodoro and Productivity Tracking
// Comprehensive REST API for focus sessions, break reminders, and productivity analytics

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Database } from '../lib/db';
import { FocusSessionService } from '../lib/focus-sessions';
import { NotificationService } from '../lib/notifications';
import { validateRequest } from '../middleware/validate';
import { authenticateUser } from '../middleware/auth';
import { logger } from '../lib/logger';
import {
  StartSessionSchema,
  CompleteSessionSchema,
  CancelSessionSchema,
  RecordDistractionSchema,
  UpdateBreakReminderSchema,
  CreateEnvironmentSchema,
  UpdateEnvironmentSchema,
  SessionsQuerySchema,
  AnalyticsQuerySchema,
  TemplateQuerySchema
} from '../schemas/focus';

import { Env } from '../lib/env';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://timeandwellness.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Initialize services
app.use('*', async (c, next) => {
  const db = new Database(c.env);
  const notificationService = new NotificationService(
    c.env.ONESIGNAL_APP_ID,
    c.env.ONESIGNAL_API_KEY,
    c.env.CACHE
  );
  const focusService = new FocusSessionService(db, notificationService);
  
  c.set('db', db);
  c.set('focusService', focusService);
  c.set('notificationService', notificationService);
  
  await next();
});

// Authentication middleware for all routes
app.use('*', authenticateUser);

// Templates Endpoints
app.get('/templates', validateRequest({ query: TemplateQuerySchema }), async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const { language, session_type } = c.req.valid('query');
    
    let templates = await focusService.getTemplates(language);
    
    if (session_type) {
      templates = templates.filter(t => t.session_type === session_type);
    }
    
    return c.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Failed to get focus templates:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve focus templates'
    }, 500);
  }
});

app.get('/templates/:templateKey', async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const templateKey = c.req.param('templateKey');
    
    const template = await focusService.getTemplate(templateKey);
    
    if (!template) {
      return c.json({
        success: false,
        error: 'Template not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Failed to get focus template:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve focus template'
    }, 500);
  }
});

// Session Management Endpoints
app.post('/sessions', validateRequest({ json: StartSessionSchema }), async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    const sessionData = c.req.valid('json');
    
    const session = await focusService.startSession(userId, sessionData);
    
    return c.json({
      success: true,
      data: session
    }, 201);
  } catch (error) {
    logger.error('Failed to start focus session:', error);
    return c.json({
      success: false,
      error: 'Failed to start focus session'
    }, 500);
  }
});

app.get('/sessions', validateRequest({ query: SessionsQuerySchema }), async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    const queryParams = c.req.valid('query');
    
    const result = await focusService.getUserSessions(userId, queryParams);
    
    return c.json({
      success: true,
      data: result.sessions,
      pagination: {
        total: result.total,
        limit: queryParams.limit,
        offset: queryParams.offset,
        hasMore: result.total > (queryParams.offset + queryParams.limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get user sessions:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve sessions'
    }, 500);
  }
});

app.get('/sessions/:sessionId', async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    const sessionId = c.req.param('sessionId');
    
    const session = await focusService.getSession(userId, sessionId);
    
    if (!session) {
      return c.json({
        success: false,
        error: 'Session not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Failed to get focus session:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve session'
    }, 500);
  }
});

app.patch('/sessions/:sessionId/complete', validateRequest({ json: CompleteSessionSchema }), async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    const sessionId = c.req.param('sessionId');
    const completionData = c.req.valid('json');
    
    const session = await focusService.completeSession(userId, sessionId, completionData);
    
    return c.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Failed to complete focus session:', error);
    return c.json({
      success: false,
      error: 'Failed to complete session'
    }, 500);
  }
});

app.patch('/sessions/:sessionId/cancel', validateRequest({ json: CancelSessionSchema }), async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    const sessionId = c.req.param('sessionId');
    const { reason } = c.req.valid('json');
    
    await focusService.cancelSession(userId, sessionId, reason);
    
    return c.json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    logger.error('Failed to cancel focus session:', error);
    return c.json({
      success: false,
      error: 'Failed to cancel session'
    }, 500);
  }
});

// Distraction Tracking
app.post('/sessions/:sessionId/distractions', validateRequest({ json: RecordDistractionSchema }), async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    const sessionId = c.req.param('sessionId');
    const distractionData = c.req.valid('json');
    
    const distraction = await focusService.recordDistraction(userId, sessionId, distractionData);
    
    return c.json({
      success: true,
      data: distraction
    }, 201);
  } catch (error) {
    logger.error('Failed to record distraction:', error);
    return c.json({
      success: false,
      error: 'Failed to record distraction'
    }, 500);
  }
});

// Break Reminders
app.get('/break-reminders', async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    
    const reminders = await focusService.getUserBreakReminders(userId);
    
    return c.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    logger.error('Failed to get break reminders:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve break reminders'
    }, 500);
  }
});

app.patch('/break-reminders/:reminderId', validateRequest({ json: UpdateBreakReminderSchema }), async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    const reminderId = c.req.param('reminderId');
    const updates = c.req.valid('json');
    
    await focusService.updateBreakReminder(userId, reminderId, updates);
    
    return c.json({
      success: true,
      message: 'Break reminder updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update break reminder:', error);
    return c.json({
      success: false,
      error: 'Failed to update break reminder'
    }, 500);
  }
});

// Analytics and Dashboard
app.get('/dashboard', async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    
    const dashboard = await focusService.getFocusDashboard(userId);
    
    return c.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Failed to get focus dashboard:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve dashboard data'
    }, 500);
  }
});

app.get('/analytics', validateRequest({ query: AnalyticsQuerySchema }), async (c) => {
  try {
    const db = c.get('db') as Database;
    const userId = c.get('userId') as string;
    const { start_date, end_date, metric_type } = c.req.valid('query');
    
    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (start_date) {
      whereClause += ' AND measurement_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ' AND measurement_date <= ?';
      params.push(end_date);
    }
    
    if (metric_type) {
      whereClause += ' AND metric_type = ?';
      params.push(metric_type);
    }
    
    const analytics = await db.prepare(`
      SELECT * FROM focus_analytics 
      ${whereClause}
      ORDER BY measurement_date DESC
      LIMIT 100
    `).all(...params);
    
    return c.json({
      success: true,
      data: analytics.map(item => ({
        ...item,
        additional_data: JSON.parse(item.additional_data || '{}')
      }))
    });
  } catch (error) {
    logger.error('Failed to get focus analytics:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve analytics'
    }, 500);
  }
});

app.get('/patterns', async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const userId = c.get('userId') as string;
    
    const patterns = await focusService.getProductivityPatterns(userId);
    
    return c.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    logger.error('Failed to get productivity patterns:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve productivity patterns'
    }, 500);
  }
});

// Statistics Endpoints
app.get('/stats/weekly', async (c) => {
  try {
    const db = c.get('db') as Database;
    const userId = c.get('userId') as string;
    const weekStart = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const weeklyStats = await db.prepare(`
      SELECT 
        DATE(datetime(started_at/1000, 'unixepoch')) as date,
        COUNT(*) as sessions,
        SUM(actual_duration) as total_minutes,
        AVG(productivity_rating) as avg_rating,
        COUNT(CASE WHEN is_successful = 1 THEN 1 END) as successful_sessions
      FROM focus_sessions 
      WHERE user_id = ? AND started_at >= ?
      GROUP BY DATE(datetime(started_at/1000, 'unixepoch'))
      ORDER BY date DESC
    `).all(userId, weekStart);
    
    return c.json({
      success: true,
      data: weeklyStats
    });
  } catch (error) {
    logger.error('Failed to get weekly stats:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve weekly statistics'
    }, 500);
  }
});

app.get('/stats/session-types', async (c) => {
  try {
    const db = c.get('db') as Database;
    const userId = c.get('userId') as string;
    const monthStart = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const sessionTypeStats = await db.prepare(`
      SELECT 
        session_type,
        COUNT(*) as count,
        SUM(actual_duration) as total_minutes,
        AVG(productivity_rating) as avg_rating,
        AVG(actual_duration) as avg_duration
      FROM focus_sessions 
      WHERE user_id = ? AND started_at >= ? AND completed_at IS NOT NULL
      GROUP BY session_type
      ORDER BY count DESC
    `).all(userId, monthStart);
    
    return c.json({
      success: true,
      data: sessionTypeStats
    });
  } catch (error) {
    logger.error('Failed to get session type stats:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve session type statistics'
    }, 500);
  }
});

// Environment Management (for tracking where users are most productive)
app.post('/environments', validateRequest({ json: CreateEnvironmentSchema }), async (c) => {
  try {
    const db = c.get('db') as Database;
    const userId = c.get('userId') as string;
    const environmentData = c.req.valid('json');
    
    const environmentId = `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    await db.prepare(`
      INSERT INTO focus_environments (
        id, user_id, environment_name, location_type, noise_level,
        lighting_quality, temperature_comfort, ergonomics_rating,
        distraction_level, session_count, total_duration, is_favorite,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      environmentId, userId, environmentData.environment_name,
      environmentData.location_type, environmentData.noise_level,
      environmentData.lighting_quality, environmentData.temperature_comfort,
      environmentData.ergonomics_rating, environmentData.distraction_level,
      0, 0, environmentData.is_favorite ? 1 : 0, now, now
    );
    
    const environment = await db.prepare(`
      SELECT * FROM focus_environments WHERE id = ?
    `).get(environmentId);
    
    return c.json({
      success: true,
      data: {
        ...environment,
        is_favorite: Boolean(environment.is_favorite)
      }
    }, 201);
  } catch (error) {
    logger.error('Failed to create environment:', error);
    return c.json({
      success: false,
      error: 'Failed to create environment'
    }, 500);
  }
});

app.get('/environments', async (c) => {
  try {
    const db = c.get('db') as Database;
    const userId = c.get('userId') as string;
    
    const environments = await db.prepare(`
      SELECT * FROM focus_environments 
      WHERE user_id = ?
      ORDER BY productivity_rating DESC, session_count DESC
    `).all(userId);
    
    return c.json({
      success: true,
      data: environments.map(env => ({
        ...env,
        is_favorite: Boolean(env.is_favorite)
      }))
    });
  } catch (error) {
    logger.error('Failed to get environments:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve environments'
    }, 500);
  }
});

app.patch('/environments/:environmentId', validateRequest({ json: UpdateEnvironmentSchema }), async (c) => {
  try {
    const db = c.get('db') as Database;
    const userId = c.get('userId') as string;
    const environmentId = c.req.param('environmentId');
    const updates = c.req.valid('json');
    const now = Date.now();
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(key === 'is_favorite' ? (value ? 1 : 0) : value);
      }
    });
    
    if (updateFields.length === 0) {
      return c.json({
        success: false,
        error: 'No valid fields to update'
      }, 400);
    }
    
    updateFields.push('updated_at = ?');
    params.push(now, environmentId, userId);
    
    await db.prepare(`
      UPDATE focus_environments SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...params);
    
    const environment = await db.prepare(`
      SELECT * FROM focus_environments WHERE id = ? AND user_id = ?
    `).get(environmentId, userId);
    
    if (!environment) {
      return c.json({
        success: false,
        error: 'Environment not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        ...environment,
        is_favorite: Boolean(environment.is_favorite)
      }
    });
  } catch (error) {
    logger.error('Failed to update environment:', error);
    return c.json({
      success: false,
      error: 'Failed to update environment'
    }, 500);
  }
});

app.delete('/environments/:environmentId', async (c) => {
  try {
    const db = c.get('db') as Database;
    const userId = c.get('userId') as string;
    const environmentId = c.req.param('environmentId');
    
    const result = await db.prepare(`
      DELETE FROM focus_environments 
      WHERE id = ? AND user_id = ?
    `).run(environmentId, userId);
    
    if (result.changes === 0) {
      return c.json({
        success: false,
        error: 'Environment not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      message: 'Environment deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete environment:', error);
    return c.json({
      success: false,
      error: 'Failed to delete environment'
    }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    service: 'focus-sessions',
    timestamp: Date.now()
  });
});

export default app;