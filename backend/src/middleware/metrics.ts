import { Context, Next } from 'hono';
import { DatabaseService } from '../lib/db';

export interface MetricsEnv {
  DB: D1Database;
}

export async function collectMetrics(c: Context<{ Bindings: MetricsEnv }>, next: Next) {
  const startTime = Date.now();
  
  try {
    await next();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Extract request information
    const method = c.req.method;
    const url = new URL(c.req.url);
    const endpoint = url.pathname;
    const statusCode = c.res.status;
    const userAgent = c.req.header('user-agent') || '';
    const ipAddress = c.req.header('cf-connecting-ip') || 
                     c.req.header('x-forwarded-for') || 
                     c.req.header('x-real-ip') || 
                     'unknown';
    
    // Get user ID from JWT if available
    let userId = null;
    try {
      const authHeader = c.req.header('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // In a real implementation, you'd decode the JWT here
        // For now, we'll extract from context if available
        userId = (c as any).user?.userId || null;
      }
    } catch (error) {
      // Ignore JWT parsing errors
    }
    
    // Record API usage metrics
    try {
      if (c.env?.DB) {
        const db = new DatabaseService(c.env);
        await db.execute(`
          INSERT INTO api_usage_stats (
            endpoint, method, status_code, response_time, 
            user_id, ip_address, user_agent, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          endpoint,
          method,
          statusCode,
          responseTime,
          userId,
          ipAddress,
          userAgent,
          Date.now()
        ]);
      }
    } catch (error) {
      console.error('Failed to record API usage metrics:', error);
      // Don't fail the request if metrics collection fails
    }
    
    // Record performance metrics
    try {
      if (c.env?.DB) {
        const db = new DatabaseService(c.env);
        await db.execute(`
          INSERT INTO performance_metrics (
            metric_name, metric_value, unit, category, 
            tags, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          'api_response_time',
          responseTime,
          'ms',
          'api',
          JSON.stringify({ endpoint, method, status_code: statusCode }),
          Date.now()
        ]);
      }
    } catch (error) {
      console.error('Failed to record performance metrics:', error);
      // Don't fail the request if metrics collection fails
    }
    
  } catch (error) {
    // Record error metrics
    try {
      if (c.env?.DB) {
        const db = new DatabaseService(c.env);
        const method = c.req.method;
        const url = new URL(c.req.url);
        const endpoint = url.pathname;
        const userId = (c as any).user?.userId || null;
        
        await db.execute(`
          INSERT INTO error_logs (
            error_type, error_message, stack_trace, 
            user_id, endpoint, method, status_code, 
            request_id, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'api_error',
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error.stack : null,
          userId,
          endpoint,
          method,
          500,
          c.req.header('x-request-id') || null,
          JSON.stringify({ 
            url: c.req.url,
            userAgent: c.req.header('user-agent'),
            ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')
          }),
          Date.now()
        ]);
      }
    } catch (metricsError) {
      console.error('Failed to record error metrics:', metricsError);
    }
    
    throw error; // Re-throw the original error
  }
}

// System metrics collection function
export async function recordSystemMetric(
  env: MetricsEnv,
  name: string,
  value: number,
  tags: Record<string, any> = {}
) {
  try {
    const db = new DatabaseService(env);
    await db.execute(`
      INSERT INTO system_metrics (name, value, tags, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [name, value, JSON.stringify(tags), Date.now(), Date.now()]);
  } catch (error) {
    console.error('Failed to record system metric:', error);
  }
}

// Health check metrics
export async function recordHealthCheck(
  env: MetricsEnv,
  serviceName: string,
  status: 'healthy' | 'degraded' | 'unhealthy',
  responseTime?: number,
  errorMessage?: string,
  metadata?: Record<string, any>
) {
  try {
    const db = new DatabaseService(env);
    await db.execute(`
      INSERT INTO health_check_logs (
        service_name, status, response_time, error_message, 
        metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      serviceName,
      status,
      responseTime || null,
      errorMessage || null,
      metadata ? JSON.stringify(metadata) : null,
      Date.now()
    ]);
  } catch (error) {
    console.error('Failed to record health check:', error);
  }
}

// Alert system
export async function createSystemAlert(
  env: MetricsEnv,
  alertType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  try {
    const db = new DatabaseService(env);
    await db.execute(`
      INSERT INTO system_alerts (
        alert_type, severity, title, message, 
        metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      alertType,
      severity,
      title,
      message,
      metadata ? JSON.stringify(metadata) : null,
      Date.now()
    ]);
  } catch (error) {
    console.error('Failed to create system alert:', error);
  }
}
