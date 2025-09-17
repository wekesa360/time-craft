import { Hono } from 'hono';
import { DatabaseService } from '../lib/db';

const metrics = new Hono();

// Metrics collection endpoint
metrics.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, value, tags = {}, timestamp = Date.now() } = body;

    if (!name || value === undefined) {
      return c.json({ error: 'Name and value are required' }, 400);
    }

    const db = new DatabaseService(c.env);
    
    await db.execute(`
      INSERT INTO system_metrics (name, value, tags, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [name, value, JSON.stringify(tags), timestamp, Date.now()]);

    return c.json({ success: true, message: 'Metric recorded' }, 201);
  } catch (error) {
    console.error('Metrics collection error:', error);
    return c.json({ error: 'Failed to record metric' }, 500);
  }
});

// Get metrics endpoint
metrics.get('/', async (c) => {
  try {
    const { name, start_time, end_time, limit = 1000 } = c.req.query();
    
    const db = new DatabaseService(c.env);
    let query = 'SELECT * FROM system_metrics WHERE 1=1';
    const params: any[] = [];

    if (name) {
      query += ' AND name = ?';
      params.push(name);
    }

    if (start_time) {
      query += ' AND timestamp >= ?';
      params.push(parseInt(start_time));
    }

    if (end_time) {
      query += ' AND timestamp <= ?';
      params.push(parseInt(end_time));
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));

    const result = await db.query(query, params);
    
    return c.json({
      metrics: result.results || [],
      count: result.results?.length || 0,
      query: { name, start_time, end_time, limit }
    });
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    return c.json({ error: 'Failed to retrieve metrics' }, 500);
  }
});

// System analytics endpoint
metrics.get('/analytics', async (c) => {
  try {
    const db = new DatabaseService(c.env);
    const now = Date.now();
    const last24h = now - 86400000;
    const last7d = now - 604800000;
    const last30d = now - 2592000000;

    // Get user analytics
    const userAnalytics = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as users_24h,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as users_7d,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as users_30d,
        COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscriptions
      FROM users
    `, [last24h, last7d, last30d]);

    // Get task analytics
    const taskAnalytics = await db.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as tasks_24h,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as tasks_7d,
        ROUND(AVG(CASE WHEN completed = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as completion_rate
      FROM tasks
    `, [last24h, last7d]);

    // Get voice processing analytics
    const voiceAnalytics = await db.query(`
      SELECT 
        COUNT(*) as total_recordings,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as recordings_24h,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as recordings_7d,
        SUM(file_size_bytes) as total_storage_bytes,
        AVG(duration_seconds) as avg_duration_seconds
      FROM voice_recordings
    `, [last24h, last7d]);

    // Get health log analytics
    const healthAnalytics = await db.query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as logs_24h,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as logs_7d,
        COUNT(CASE WHEN log_type = 'exercise' THEN 1 END) as exercise_logs,
        COUNT(CASE WHEN log_type = 'nutrition' THEN 1 END) as nutrition_logs,
        COUNT(CASE WHEN log_type = 'sleep' THEN 1 END) as sleep_logs
      FROM health_logs
    `, [last24h, last7d]);

    // Get focus session analytics
    const focusAnalytics = await db.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as sessions_24h,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as sessions_7d,
        COUNT(CASE WHEN is_successful = 1 THEN 1 END) as successful_sessions,
        AVG(actual_duration) as avg_session_duration,
        AVG(productivity_rating) as avg_productivity_rating
      FROM focus_sessions
    `, [last24h, last7d]);

    // Get badge analytics
    const badgeAnalytics = await db.query(`
      SELECT 
        COUNT(*) as total_badges_earned,
        COUNT(CASE WHEN earned_at > ? THEN 1 END) as badges_24h,
        COUNT(CASE WHEN earned_at > ? THEN 1 END) as badges_7d,
        COUNT(DISTINCT user_id) as users_with_badges
      FROM user_badges
    `, [last24h, last7d]);

    // Get system metrics
    const systemMetrics = await db.query(`
      SELECT 
        name,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as data_points
      FROM system_metrics 
      WHERE timestamp > ?
      GROUP BY name
      ORDER BY data_points DESC
    `, [last24h]);

    return c.json({
      timestamp: new Date().toISOString(),
      period: {
        last_24h: last24h,
        last_7d: last7d,
        last_30d: last30d
      },
      analytics: {
        users: userAnalytics.results?.[0] || {},
        tasks: taskAnalytics.results?.[0] || {},
        voice_processing: voiceAnalytics.results?.[0] || {},
        health_logs: healthAnalytics.results?.[0] || {},
        focus_sessions: focusAnalytics.results?.[0] || {},
        badges: badgeAnalytics.results?.[0] || {},
        system_metrics: systemMetrics.results || []
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ error: 'Failed to retrieve analytics' }, 500);
  }
});

// Real-time metrics endpoint
metrics.get('/realtime', async (c) => {
  try {
    const db = new DatabaseService(c.env);
    const now = Date.now();
    const last5m = now - 300000; // 5 minutes ago

    // Get recent activity
    const recentActivity = await db.query(`
      SELECT 
        'user_registration' as activity_type,
        COUNT(*) as count
      FROM users 
      WHERE created_at > ?
      UNION ALL
      SELECT 
        'task_completion' as activity_type,
        COUNT(*) as count
      FROM tasks 
      WHERE completed = 1 AND completed_at > ?
      UNION ALL
      SELECT 
        'voice_recording' as activity_type,
        COUNT(*) as count
      FROM voice_recordings 
      WHERE created_at > ?
      UNION ALL
      SELECT 
        'focus_session' as activity_type,
        COUNT(*) as count
      FROM focus_sessions 
      WHERE created_at > ?
      UNION ALL
      SELECT 
        'health_log' as activity_type,
        COUNT(*) as count
      FROM health_logs 
      WHERE created_at > ?
    `, [last5m, last5m, last5m, last5m, last5m]);

    // Get current system load
    const systemLoad = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: now
    };

    return c.json({
      timestamp: new Date().toISOString(),
      period: 'last_5_minutes',
      recent_activity: recentActivity.results || [],
      system_load: systemLoad
    });
  } catch (error) {
    console.error('Real-time metrics error:', error);
    return c.json({ error: 'Failed to retrieve real-time metrics' }, 500);
  }
});

// Metrics summary endpoint
metrics.get('/summary', async (c) => {
  try {
    const db = new DatabaseService(c.env);
    const now = Date.now();
    const last24h = now - 86400000;

    // Get key metrics summary
    const summary = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM tasks) as total_tasks,
        (SELECT COUNT(*) FROM voice_recordings) as total_voice_recordings,
        (SELECT COUNT(*) FROM health_logs) as total_health_logs,
        (SELECT COUNT(*) FROM focus_sessions) as total_focus_sessions,
        (SELECT COUNT(*) FROM user_badges) as total_badges_earned,
        (SELECT COUNT(*) FROM users WHERE created_at > ?) as new_users_24h,
        (SELECT COUNT(*) FROM tasks WHERE created_at > ?) as new_tasks_24h,
        (SELECT COUNT(*) FROM voice_recordings WHERE created_at > ?) as new_recordings_24h
    `, [last24h, last24h, last24h]);

    return c.json({
      timestamp: new Date().toISOString(),
      summary: summary.results?.[0] || {},
      status: 'healthy'
    });
  } catch (error) {
    console.error('Summary error:', error);
    return c.json({ error: 'Failed to retrieve summary' }, 500);
  }
});

// Prometheus metrics endpoint
metrics.get('/prometheus', async (c) => {
  try {
    const db = new DatabaseService(c.env);
    const now = Date.now();
    const last24h = now - 86400000;

    // Get system metrics for Prometheus format
    const systemMetrics = await db.query(`
      SELECT 
        name,
        value,
        tags,
        timestamp
      FROM system_metrics 
      WHERE timestamp > ?
      ORDER BY name, timestamp DESC
    `, [last24h]);

    // Get application metrics
    const appMetrics = await db.query(`
      SELECT 
        'total_users' as name,
        COUNT(*) as value,
        '{}' as tags
      FROM users
      UNION ALL
      SELECT 
        'active_users_24h' as name,
        COUNT(*) as value,
        '{}' as tags
      FROM users WHERE created_at > ?
      UNION ALL
      SELECT 
        'total_tasks' as name,
        COUNT(*) as value,
        '{}' as tags
      FROM tasks
      UNION ALL
      SELECT 
        'completed_tasks' as name,
        COUNT(*) as value,
        '{}' as tags
      FROM tasks WHERE completed = 1
      UNION ALL
      SELECT 
        'total_focus_sessions' as name,
        COUNT(*) as value,
        '{}' as tags
      FROM focus_sessions
      UNION ALL
      SELECT 
        'successful_focus_sessions' as name,
        COUNT(*) as value,
        '{}' as tags
      FROM focus_sessions WHERE is_successful = 1
      UNION ALL
      SELECT 
        'total_voice_recordings' as name,
        COUNT(*) as value,
        '{}' as tags
      FROM voice_recordings
      UNION ALL
      SELECT 
        'total_health_logs' as name,
        COUNT(*) as value,
        '{}' as tags
      FROM health_logs
      UNION ALL
      SELECT 
        'total_badges_earned' as name,
        COUNT(*) as value,
        '{}' as tags
      FROM user_badges
    `, [last24h]);

    // Get API usage metrics
    const apiMetrics = await db.query(`
      SELECT 
        endpoint,
        method,
        status_code,
        COUNT(*) as request_count,
        AVG(response_time) as avg_response_time,
        MAX(response_time) as max_response_time
      FROM api_usage_stats 
      WHERE created_at > ?
      GROUP BY endpoint, method, status_code
    `, [last24h]);

    // Get performance metrics
    const perfMetrics = await db.query(`
      SELECT 
        metric_name,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        category
      FROM performance_metrics 
      WHERE created_at > ?
      GROUP BY metric_name, category
    `, [last24h]);

    // Build Prometheus format
    let prometheusOutput = '# HELP time_wellness_application_info Application information\n';
    prometheusOutput += '# TYPE time_wellness_application_info gauge\n';
    prometheusOutput += `time_wellness_application_info{version="1.0.0",environment="${process.env.NODE_ENV || 'development'}"} 1\n\n`;

    // System metrics
    prometheusOutput += '# HELP time_wellness_system_metrics System metrics\n';
    prometheusOutput += '# TYPE time_wellness_system_metrics gauge\n';
    for (const metric of systemMetrics.results || []) {
      const tags = metric.tags ? JSON.parse(metric.tags) : {};
      const tagString = Object.entries(tags)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');
      const tagsFormatted = tagString ? `{${tagString}}` : '';
      prometheusOutput += `time_wellness_system_metrics{name="${metric.name}"${tagsFormatted}} ${metric.value}\n`;
    }
    prometheusOutput += '\n';

    // Application metrics
    prometheusOutput += '# HELP time_wellness_application_metrics Application metrics\n';
    prometheusOutput += '# TYPE time_wellness_application_metrics gauge\n';
    for (const metric of appMetrics.results || []) {
      prometheusOutput += `time_wellness_application_metrics{name="${metric.name}"} ${metric.value}\n`;
    }
    prometheusOutput += '\n';

    // API metrics
    prometheusOutput += '# HELP time_wellness_api_requests_total Total API requests\n';
    prometheusOutput += '# TYPE time_wellness_api_requests_total counter\n';
    for (const metric of apiMetrics.results || []) {
      prometheusOutput += `time_wellness_api_requests_total{endpoint="${metric.endpoint}",method="${metric.method}",status_code="${metric.status_code}"} ${metric.request_count}\n`;
    }
    prometheusOutput += '\n';

    prometheusOutput += '# HELP time_wellness_api_response_time_seconds API response time\n';
    prometheusOutput += '# TYPE time_wellness_api_response_time_seconds histogram\n';
    for (const metric of apiMetrics.results || []) {
      prometheusOutput += `time_wellness_api_response_time_seconds{endpoint="${metric.endpoint}",method="${metric.method}"} ${metric.avg_response_time / 1000}\n`;
    }
    prometheusOutput += '\n';

    // Performance metrics
    prometheusOutput += '# HELP time_wellness_performance_metrics Performance metrics\n';
    prometheusOutput += '# TYPE time_wellness_performance_metrics gauge\n';
    for (const metric of perfMetrics.results || []) {
      prometheusOutput += `time_wellness_performance_metrics{name="${metric.metric_name}",category="${metric.category}"} ${metric.avg_value}\n`;
    }
    prometheusOutput += '\n';

    // Memory metrics
    const memUsage = process.memoryUsage();
    prometheusOutput += '# HELP time_wellness_memory_usage_bytes Memory usage in bytes\n';
    prometheusOutput += '# TYPE time_wellness_memory_usage_bytes gauge\n';
    prometheusOutput += `time_wellness_memory_usage_bytes{type="rss"} ${memUsage.rss}\n`;
    prometheusOutput += `time_wellness_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}\n`;
    prometheusOutput += `time_wellness_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}\n`;
    prometheusOutput += `time_wellness_memory_usage_bytes{type="external"} ${memUsage.external}\n`;
    prometheusOutput += '\n';

    // Uptime metric
    prometheusOutput += '# HELP time_wellness_uptime_seconds Application uptime in seconds\n';
    prometheusOutput += '# TYPE time_wellness_uptime_seconds counter\n';
    prometheusOutput += `time_wellness_uptime_seconds ${process.uptime()}\n`;

    return new Response(prometheusOutput, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
      }
    });
  } catch (error) {
    console.error('Prometheus metrics error:', error);
    return c.text('# ERROR: Failed to retrieve metrics\n', 500);
  }
});

export default metrics;
