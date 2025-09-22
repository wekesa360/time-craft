// Security Enhancements API Endpoints
// Handles audit logging, security events, and compliance reporting

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../lib/env';
import { DatabaseService } from '../lib/db';
import { SecurityEnhancementService } from '../lib/security-enhancements';

const security = new Hono<{ Bindings: Env }>();

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

// Helper function to check admin permissions
async function checkAdminPermissions(c: any) {
  const auth = await getUserFromToken(c);
  if (!auth) return false;

  const db = new DatabaseService(c.env);
  const user = await db.query(`
    SELECT role FROM users WHERE id = ?
  `, [auth.userId]);

  return user.results.length > 0 && (user.results[0] as any).role === 'admin';
}

// ========== AUDIT LOGGING ==========

// POST /security/audit/log - Log audit event
security.post('/audit/log',
  zValidator('json', z.object({
    action: z.string(),
    resource: z.string(),
    resourceId: z.string().optional(),
    details: z.record(z.any()).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const auditData = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const securityService = new SecurityEnhancementService(db, c.env.ENCRYPTION_KEY || 'default-key');

    try {
      const auditId = await securityService.logAuditEvent({
        userId: auth.userId,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId,
        details: auditData.details || {},
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        userAgent: c.req.header('user-agent') || 'unknown',
        severity: auditData.severity || 'low',
        success: true
      });
      
      return c.json({
        success: true,
        auditId,
        message: 'Audit event logged successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Audit logging failed'
      }, 500);
    }
  }
);

// GET /security/audit/logs - Get audit logs with filtering
security.get('/audit/logs', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);
  const securityService = new SecurityEnhancementService(db, c.env.ENCRYPTION_KEY || 'default-key');

  try {
    const filters = {
      userId: c.req.query('userId') || auth.userId,
      action: c.req.query('action'),
      severity: c.req.query('severity'),
      startTime: c.req.query('startTime') ? parseInt(c.req.query('startTime')!) : undefined,
      endTime: c.req.query('endTime') ? parseInt(c.req.query('endTime')!) : undefined,
      limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50,
      offset: c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0
    };

    const logs = await securityService.getAuditLogs(filters);
    
    return c.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Audit logs retrieval failed'
    }, 500);
  }
});

// ========== SECURITY EVENTS ==========

// GET /security/events - Get security events
security.get('/events', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const db = new DatabaseService(c.env);

  try {
    const events = await db.query(`
      SELECT * FROM security_events 
      ORDER BY timestamp DESC 
      LIMIT 100
    `);
    
    return c.json({
      success: true,
      events: events.results
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Security events retrieval failed'
    }, 500);
  }
});

// POST /security/events/:eventId/resolve - Resolve security event
security.post('/events/:eventId/resolve',
  zValidator('json', z.object({
    resolvedBy: z.string()
  })),
  async (c) => {
    const isAdmin = await checkAdminPermissions(c);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const eventId = c.req.param('eventId');
    const { resolvedBy } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const securityService = new SecurityEnhancementService(db, c.env.ENCRYPTION_KEY || 'default-key');

    try {
      await securityService.resolveSecurityEvent(eventId, resolvedBy);
      
      return c.json({
        success: true,
        message: 'Security event resolved successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Event resolution failed'
      }, 500);
    }
  }
);

// ========== RATE LIMITING ==========

// POST /security/rate-limit/check - Check rate limit
security.post('/rate-limit/check',
  zValidator('json', z.object({
    identifier: z.string(),
    action: z.string(),
    limit: z.number().min(1).max(1000),
    windowMs: z.number().min(1000).max(3600000) // 1 second to 1 hour
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { identifier, action, limit, windowMs } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const securityService = new SecurityEnhancementService(db, c.env.ENCRYPTION_KEY || 'default-key');

    try {
      const result = await securityService.checkRateLimit(identifier, limit, windowMs, action);
      
      return c.json({
        success: true,
        allowed: result.allowed,
        remaining: result.remaining,
        resetTime: result.resetTime
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Rate limit check failed'
      }, 500);
    }
  }
);

// ========== DATA ENCRYPTION ==========

// POST /security/encrypt - Encrypt sensitive data
security.post('/encrypt',
  zValidator('json', z.object({
    data: z.string()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const securityService = new SecurityEnhancementService(db, c.env.ENCRYPTION_KEY || 'default-key');

    try {
      const encryptedData = securityService.encryptData(data);
      
      return c.json({
        success: true,
        encryptedData,
        message: 'Data encrypted successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed'
      }, 500);
    }
  }
);

// POST /security/decrypt - Decrypt sensitive data
security.post('/decrypt',
  zValidator('json', z.object({
    encryptedData: z.string()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { encryptedData } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const securityService = new SecurityEnhancementService(db, c.env.ENCRYPTION_KEY || 'default-key');

    try {
      const decryptedData = securityService.decryptData(encryptedData);
      
      return c.json({
        success: true,
        decryptedData,
        message: 'Data decrypted successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed'
      }, 500);
    }
  }
);

// ========== COMPLIANCE REPORTING ==========

// POST /security/compliance/report - Generate compliance report
security.post('/compliance/report',
  zValidator('json', z.object({
    reportType: z.enum(['gdpr', 'ccpa', 'hipaa', 'sox', 'pci']),
    period: z.object({
      start: z.number(),
      end: z.number()
    })
  })),
  async (c) => {
    const isAdmin = await checkAdminPermissions(c);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { reportType, period } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const securityService = new SecurityEnhancementService(db, c.env.ENCRYPTION_KEY || 'default-key');

    try {
      const report = await securityService.generateComplianceReport(reportType, period);
      
      return c.json({
        success: true,
        report,
        message: 'Compliance report generated successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      }, 500);
    }
  }
);

// GET /security/compliance/reports - List compliance reports
security.get('/compliance/reports', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const db = new DatabaseService(c.env);

  try {
    const reports = await db.query(`
      SELECT report_id, report_type, generated_at, period_start, period_end, compliance
      FROM compliance_reports 
      ORDER BY generated_at DESC
    `);
    
    return c.json({
      success: true,
      reports: reports.results
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Reports retrieval failed'
    }, 500);
  }
});

// GET /security/compliance/reports/:reportId - Get specific compliance report
security.get('/compliance/reports/:reportId', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const reportId = c.req.param('reportId');
  const db = new DatabaseService(c.env);

  try {
    const report = await db.query(`
      SELECT * FROM compliance_reports WHERE report_id = ?
    `, [reportId]);
    
    if (report.results.length === 0) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    return c.json({
      success: true,
      report: report.results[0]
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Report retrieval failed'
    }, 500);
  }
});

// ========== SECURITY DASHBOARD ==========

// GET /security/dashboard - Get security dashboard data
security.get('/dashboard', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const db = new DatabaseService(c.env);
  const securityService = new SecurityEnhancementService(db, c.env.ENCRYPTION_KEY || 'default-key');

  try {
    const dashboard = await securityService.getSecurityDashboard();
    
    return c.json({
      success: true,
      dashboard
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Dashboard data retrieval failed'
    }, 500);
  }
});

// ========== SECURITY MONITORING ==========

// GET /security/monitoring/alerts - Get security alerts
security.get('/monitoring/alerts', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const db = new DatabaseService(c.env);

  try {
    const alerts = await db.query(`
      SELECT * FROM security_events 
      WHERE severity IN ('high', 'critical') AND resolved = false
      ORDER BY timestamp DESC
    `);
    
    return c.json({
      success: true,
      alerts: alerts.results
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Alerts retrieval failed'
    }, 500);
  }
});

// GET /security/monitoring/metrics - Get security metrics
security.get('/monitoring/metrics', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const db = new DatabaseService(c.env);

  try {
    // Get metrics for last 24 hours
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    
    const auditLogs = await db.query(`
      SELECT COUNT(*) as count, severity
      FROM audit_logs 
      WHERE timestamp > ?
      GROUP BY severity
    `, [last24h]);

    const securityEvents = await db.query(`
      SELECT COUNT(*) as count, type
      FROM security_events 
      WHERE timestamp > ?
      GROUP BY type
    `, [last24h]);

    const failedLogins = await db.query(`
      SELECT COUNT(*) as count
      FROM audit_logs 
      WHERE action = 'login' AND success = false AND timestamp > ?
    `, [last24h]);

    return c.json({
      success: true,
      metrics: {
        auditLogs: auditLogs.results,
        securityEvents: securityEvents.results,
        failedLogins: (failedLogins.results[0] as any).count,
        period: '24h'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Metrics retrieval failed'
    }, 500);
  }
});

// ========== SECURITY SETTINGS ==========

// GET /security/settings - Get security settings
security.get('/settings', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);

  try {
    const settings = await db.query(`
      SELECT security_settings FROM users WHERE id = ?
    `, [auth.userId]);

    const securitySettings = settings.results.length > 0 
      ? JSON.parse((settings.results[0] as any).security_settings || '{}')
      : {};

    return c.json({
      success: true,
      settings: {
        twoFactorEnabled: false,
        encryptionEnabled: true,
        auditLoggingEnabled: true,
        rateLimitingEnabled: true,
        ...securitySettings
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Settings retrieval failed'
    }, 500);
  }
});

// PUT /security/settings - Update security settings
security.put('/settings',
  zValidator('json', z.object({
    twoFactorEnabled: z.boolean().optional(),
    encryptionEnabled: z.boolean().optional(),
    auditLoggingEnabled: z.boolean().optional(),
    rateLimitingEnabled: z.boolean().optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const settings = c.req.valid('json');
    const db = new DatabaseService(c.env);

    try {
      await db.execute(`
        UPDATE users 
        SET security_settings = ?, updated_at = ?
        WHERE id = ?
      `, [JSON.stringify(settings), Date.now(), auth.userId]);
      
      return c.json({
        success: true,
        message: 'Security settings updated successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Settings update failed'
      }, 500);
    }
  }
);

export default security;
