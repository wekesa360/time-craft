// Focus Sessions Worker - API Endpoints for Pomodoro and Productivity Tracking
// Comprehensive REST API for focus sessions, break reminders, and productivity analytics

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DatabaseService } from '../lib/db';
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
  const db = new DatabaseService(c.env);
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

// Note: Authentication is handled by the API gateway, userId should be available from context

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
    console.error('Failed to get focus templates:', error);
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const sessionData = c.req.valid('json');
    
    const session = await focusService.startSession(userId, sessionData);
    
    return c.json({
      success: true,
      data: session
    }, 201);
  } catch (error) {
    console.error('Focus session start error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    logger.error('Failed to start focus session:', error);
    return c.json({
      success: false,
      error: 'Failed to start focus session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get('/sessions', validateRequest({ query: SessionsQuerySchema }), async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const sessionId = c.req.param('sessionId');
    const completionData = c.req.valid('json');
    
    const session = await focusService.completeSession(userId, sessionId, completionData);
    
    return c.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Complete session error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Session ID:', c.req.param('sessionId'));
    console.error('User ID:', c.get('jwtPayload')?.userId);
    console.error('Completion data:', c.req.valid('json'));
    
    logger.error('Failed to complete focus session:', error);
    return c.json({
      success: false,
      error: 'Failed to complete session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.patch('/sessions/:sessionId/pause', async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const sessionId = c.req.param('sessionId');
    
    const session = await focusService.pauseSession(userId, sessionId);
    
    return c.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Failed to pause focus session:', error);
    return c.json({
      success: false,
      error: 'Failed to pause session'
    }, 500);
  }
});

app.patch('/sessions/:sessionId/resume', async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const sessionId = c.req.param('sessionId');
    
    const session = await focusService.resumeSession(userId, sessionId);
    
    return c.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Failed to resume focus session:', error);
    return c.json({
      success: false,
      error: 'Failed to resume session'
    }, 500);
  }
});

app.patch('/sessions/:sessionId/cancel', validateRequest({ json: CancelSessionSchema }), async (c) => {
  try {
    const focusService = c.get('focusService') as FocusSessionService;
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
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
    const db = c.get('db') as DatabaseService;
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    
    if (!userId) {
      return c.json({ success: false, error: 'User not authenticated' }, 401);
    }
    
    // Simple test query to isolate the issue
    const sessionStats = await db.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_successful = 1 THEN 1 END) as successful_sessions,
        SUM(actual_duration) as total_focus_minutes
      FROM focus_sessions 
      WHERE user_id = ?
    `, [userId]);
    
    const stats = (sessionStats.results || [])[0] || {};
    
    return c.json({
      success: true,
      data: {
        total_sessions: stats.total_sessions || 0,
        successful_sessions: stats.successful_sessions || 0,
        total_focus_minutes: stats.total_focus_minutes || 0,
        test_message: 'Simplified dashboard working'
      }
    });
  } catch (error) {
    console.error('Focus dashboard error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    logger.error('Failed to get focus dashboard:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve dashboard data'
    }, 500);
  }
});

app.get('/analytics', async (c) => {
  try {
    const db = c.get('db') as DatabaseService;
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    
    console.log('Focus analytics request for user:', userId);
    
    // Handle period parameter (e.g., "7d", "30d")
    const period = c.req.query('period') || '7d';
    const metric_type = c.req.query('metric_type');
    
    // Parse period parameter
    let days = 7; // default
    if (period.endsWith('d')) {
      days = parseInt(period.replace('d', ''));
    } else if (period.endsWith('w')) {
      days = parseInt(period.replace('w', '')) * 7;
    } else if (period.endsWith('m')) {
      days = parseInt(period.replace('m', '')) * 30;
    }
    
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    console.log('Period:', period, 'Days:', days, 'Start time:', startTime);
    
    let whereClause = 'WHERE user_id = ? AND measurement_date >= ?';
    const params: any[] = [userId, startTime];
    
    if (metric_type) {
      whereClause += ' AND metric_type = ?';
      params.push(metric_type);
    }
    
    console.log('Querying focus_analytics with params:', params);
    
    // Get analytics data from focus_analytics table
    const analyticsResult = await db.query(`
      SELECT * FROM focus_analytics 
      ${whereClause}
      ORDER BY measurement_date DESC
      LIMIT 100
    `, params);
    
    console.log('Analytics result:', analyticsResult);
    
    // Also get focus sessions data for the period
    const focusSessionsResult = await db.query(`
      SELECT 
        session_type,
        COUNT(*) as session_count,
        SUM(actual_duration) as total_duration,
        AVG(actual_duration) as avg_duration,
        COUNT(CASE WHEN is_successful = 1 THEN 1 END) as successful_sessions
      FROM focus_sessions 
      WHERE user_id = ? AND started_at >= ?
      GROUP BY session_type
      ORDER BY session_count DESC
    `, [userId, startTime]);
    
    console.log('Focus sessions result:', focusSessionsResult);
    
    // Get daily productivity trends
    const dailyTrendsResult = await db.query(`
      SELECT 
        COUNT(*) as sessions,
        SUM(actual_duration) as total_minutes,
        COUNT(CASE WHEN is_successful = 1 THEN 1 END) as successful_sessions
      FROM focus_sessions 
      WHERE user_id = ? AND started_at >= ?
    `, [userId, startTime]);
    
    console.log('Daily trends result:', dailyTrendsResult);
    
    return c.json({
      success: true,
      data: {
        analytics: (analyticsResult.results || []).map(item => ({
          ...item,
          additional_data: JSON.parse(item.additional_data || '{}')
        })),
        focus_sessions: focusSessionsResult.results || [],
        daily_trends: dailyTrendsResult.results || [],
        period: {
          days,
          start_time: startTime,
          end_time: Date.now()
        }
      }
    });
  } catch (error) {
    console.error('Focus analytics error details:', error);
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    
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
    const db = c.get('db') as DatabaseService;
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const weekStart = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const result = await db.query(`
      SELECT 
        DATE(datetime(started_at/1000, 'unixepoch')) as date,
        COUNT(*) as sessions,
        SUM(actual_duration) as total_minutes,
        COUNT(CASE WHEN is_successful = 1 THEN 1 END) as successful_sessions
      FROM focus_sessions 
      WHERE user_id = ? AND started_at >= ?
      GROUP BY DATE(datetime(started_at/1000, 'unixepoch'))
      ORDER BY date DESC
    `, [userId, weekStart]);

    return c.json({
      success: true,
      data: result.results || []
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
    const db = c.get('db') as DatabaseService;
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    const monthStart = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const result = await db.query(`
      SELECT 
        session_type,
        COUNT(*) as count,
        SUM(actual_duration) as total_minutes,
        AVG(actual_duration) as avg_duration
      FROM focus_sessions 
      WHERE user_id = ? AND started_at >= ? AND completed_at IS NOT NULL
      GROUP BY session_type
      ORDER BY count DESC
    `, [userId, monthStart]);

    return c.json({
      success: true,
      data: result.results || []
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
    
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
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
    const jwtPayload = c.get('jwtPayload') as any;
    const userId = jwtPayload?.userId;
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