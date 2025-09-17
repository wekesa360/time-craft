/**
 * Admin Dashboard API Endpoints
 * Handles content management, analytics, and system monitoring
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Database } from '../lib/db';
import { AdminDashboardService } from '../lib/admin-dashboard';
import { authenticateUser } from '../middleware/auth';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use('*', cors());

// Initialize services
let adminService: AdminDashboardService;

app.use('*', async (c, next) => {
  const db = new Database(c.env.DB);
  adminService = new AdminDashboardService(db);
  await next();
});

// Admin authentication middleware
const adminMiddleware = (requiredPermission?: string) => {
  return async (c: any, next: any) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const admin = await adminService.checkAdminPermissions(user.id, requiredPermission);
    if (!admin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    c.set('admin', admin);
    await next();
  };
};

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
app.get('/dashboard', authenticateUser, adminMiddleware(), async (c) => {
  try {
    const stats = await adminService.getDashboardStats();

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return c.json({ error: 'Failed to get dashboard statistics' }, 500);
  }
});

/**
 * GET /api/admin/analytics
 * Get user analytics
 */
app.get('/analytics', authenticateUser, adminMiddleware('analytics_access'), async (c) => {
  try {
    const { days = '30' } = c.req.query();
    const analytics = await adminService.getUserAnalytics(parseInt(days));

    return c.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

/**
 * POST /api/admin/metrics
 * Record system metric
 */
app.post('/metrics', authenticateUser, adminMiddleware('system_monitoring'), async (c) => {
  try {
    const { metric_name, value, type, tags } = await c.req.json();
    
    if (!metric_name || value === undefined || !type) {
      return c.json({ error: 'Metric name, value, and type are required' }, 400);
    }

    await adminService.recordMetric(metric_name, value, type, tags);

    return c.json({
      success: true,
      data: {
        metric_name,
        value,
        type,
        recorded_at: Date.now()
      }
    });
  } catch (error) {
    console.error('Error recording metric:', error);
    return c.json({ error: 'Failed to record metric' }, 500);
  }
});

/**
 * GET /api/admin/metrics
 * Get system metrics
 */
app.get('/metrics', authenticateUser, adminMiddleware('system_monitoring'), async (c) => {
  try {
    const { metric_name, start_time, end_time, limit = '100' } = c.req.query();
    
    const metrics = await adminService.getMetrics(
      metric_name,
      start_time ? parseInt(start_time) : undefined,
      end_time ? parseInt(end_time) : undefined,
      parseInt(limit)
    );

    return c.json({
      success: true,
      data: {
        metrics,
        count: metrics.length
      }
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    return c.json({ error: 'Failed to get metrics' }, 500);
  }
});

/**
 * POST /api/admin/support-tickets
 * Create support ticket
 */
app.post('/support-tickets', authenticateUser, async (c) => {
  try {
    const user = c.get('user');
    const { category, priority, title, description, language = 'en' } = await c.req.json();
    
    if (!category || !priority || !title || !description) {
      return c.json({ error: 'Category, priority, title, and description are required' }, 400);
    }

    const ticketId = await adminService.createSupportTicket({
      user_id: user.id,
      category,
      priority,
      status: 'open',
      title,
      description,
      language
    });

    return c.json({
      success: true,
      data: {
        ticket_id: ticketId,
        status: 'open',
        created_at: Date.now()
      }
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return c.json({ error: 'Failed to create support ticket' }, 500);
  }
});

/**
 * GET /api/admin/support-tickets
 * Get support tickets
 */
app.get('/support-tickets', authenticateUser, adminMiddleware('support_management'), async (c) => {
  try {
    const { status, assigned_to, limit = '50', offset = '0' } = c.req.query();
    
    const tickets = await adminService.getSupportTickets(
      status,
      assigned_to,
      parseInt(limit),
      parseInt(offset)
    );

    return c.json({
      success: true,
      data: {
        tickets,
        count: tickets.length
      }
    });
  } catch (error) {
    console.error('Error getting support tickets:', error);
    return c.json({ error: 'Failed to get support tickets' }, 500);
  }
});

/**
 * PUT /api/admin/support-tickets/:id
 * Update support ticket
 */
app.put('/support-tickets/:id', authenticateUser, adminMiddleware('support_management'), async (c) => {
  try {
    const admin = c.get('admin');
    const ticketId = c.req.param('id');
    const updates = await c.req.json();
    
    const success = await adminService.updateSupportTicket(ticketId, updates, admin.id);
    
    if (!success) {
      return c.json({ error: 'Failed to update ticket' }, 500);
    }

    return c.json({
      success: true,
      data: {
        ticket_id: ticketId,
        updates,
        updated_at: Date.now()
      }
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return c.json({ error: 'Failed to update support ticket' }, 500);
  }
});

/**
 * GET /api/admin/feature-flags
 * Get feature flags
 */
app.get('/feature-flags', authenticateUser, adminMiddleware('feature_flags'), async (c) => {
  try {
    const flags = await adminService.getFeatureFlags();

    return c.json({
      success: true,
      data: {
        flags,
        count: flags.length
      }
    });
  } catch (error) {
    console.error('Error getting feature flags:', error);
    return c.json({ error: 'Failed to get feature flags' }, 500);
  }
});

/**
 * PUT /api/admin/feature-flags/:name
 * Update feature flag
 */
app.put('/feature-flags/:name', authenticateUser, adminMiddleware('feature_flags'), async (c) => {
  try {
    const admin = c.get('admin');
    const flagName = c.req.param('name');
    const updates = await c.req.json();
    
    const success = await adminService.updateFeatureFlag(flagName, updates, admin.id);
    
    if (!success) {
      return c.json({ error: 'Failed to update feature flag' }, 500);
    }

    return c.json({
      success: true,
      data: {
        flag_name: flagName,
        updates,
        updated_at: Date.now()
      }
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return c.json({ error: 'Failed to update feature flag' }, 500);
  }
});

/**
 * GET /api/admin/audit-log
 * Get admin audit log
 */
app.get('/audit-log', authenticateUser, adminMiddleware('system_monitoring'), async (c) => {
  try {
    const { admin_user_id, action, limit = '100', offset = '0' } = c.req.query();
    
    const auditLog = await adminService.getAuditLog(
      admin_user_id,
      action,
      parseInt(limit),
      parseInt(offset)
    );

    return c.json({
      success: true,
      data: {
        audit_log: auditLog,
        count: auditLog.length
      }
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    return c.json({ error: 'Failed to get audit log' }, 500);
  }
});

/**
 * GET /api/admin/users
 * Get user list with filtering
 */
app.get('/users', authenticateUser, adminMiddleware('user_management'), async (c) => {
  try {
    const { subscription_type, is_student, limit = '50', offset = '0', search } = c.req.query();
    
    const db = new Database(c.env.DB);
    let query = `SELECT id, email, first_name, last_name, subscription_type, is_student, created_at FROM users WHERE 1=1`;
    const params: any[] = [];

    if (subscription_type) {
      query += ` AND subscription_type = ?`;
      params.push(subscription_type);
    }

    if (is_student !== undefined) {
      query += ` AND is_student = ?`;
      params.push(is_student === 'true');
    }

    if (search) {
      query += ` AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const users = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user (admin action)
 */
app.put('/users/:id', authenticateUser, adminMiddleware('user_management'), async (c) => {
  try {
    const admin = c.get('admin');
    const userId = c.req.param('id');
    const updates = await c.req.json();
    
    const db = new Database(c.env.DB);
    
    // Get current user data for audit log
    const currentUser = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(userId).first();
    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await db.prepare(`
      UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?
    `).bind(...values, Date.now(), userId).run();

    // Log admin action
    await adminService.logAdminAction(admin.id, 'update_user', 'user', userId, currentUser, updates);

    return c.json({
      success: true,
      data: {
        user_id: userId,
        updates,
        updated_at: Date.now()
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

/**
 * GET /api/admin/system-health
 * Get system health status
 */
app.get('/system-health', authenticateUser, adminMiddleware('system_monitoring'), async (c) => {
  try {
    const db = new Database(c.env.DB);
    
    // Check database connectivity
    const dbCheck = await db.prepare(`SELECT 1 as test`).first();
    
    // Get recent error metrics
    const errorMetrics = await adminService.getMetrics('error_rate', Date.now() - 3600000); // Last hour
    
    // Check active users
    const activeUsers = await db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM tasks 
      WHERE updated_at >= ?
    `).bind(Date.now() - 3600000).first(); // Last hour

    const health = {
      status: 'healthy',
      database: dbCheck ? 'connected' : 'disconnected',
      active_users_last_hour: activeUsers?.count || 0,
      error_rate_last_hour: errorMetrics.length,
      timestamp: Date.now()
    };

    return c.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    return c.json({
      success: true,
      data: {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      }
    });
  }
});

export default app;