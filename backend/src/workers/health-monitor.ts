import { Hono } from 'hono';
import { DatabaseService } from '../lib/db';

const health = new Hono();

// Health check endpoint
health.get('/', async (c) => {
  const startTime = Date.now();
  
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {} as Record<string, any>
    };

    // Check database connectivity
    try {
      const db = new DatabaseService(c.env);
      const dbResult = await db.query('SELECT 1 as health_check');
      healthStatus.services.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        connected: true
      };
    } catch (error) {
      healthStatus.services.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        connected: false
      };
    }

    // Check external services
    const services = [
      { name: 'openai', url: 'https://api.openai.com/v1/models' },
      { name: 'deepgram', url: 'https://api.deepgram.com/v1/projects' },
      { name: 'onesignal', url: 'https://onesignal.com/api/v1/apps' }
    ];

    for (const service of services) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(service.url, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        healthStatus.services[service.name] = {
          status: response.ok ? 'healthy' : 'degraded',
          statusCode: response.status,
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        healthStatus.services[service.name] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Check KV store
    try {
      await c.env.CACHE.get('health_check');
      healthStatus.services.kv = {
        status: 'healthy',
        connected: true
      };
    } catch (error) {
      healthStatus.services.kv = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        connected: false
      };
    }

    // Check R2 storage
    try {
      await c.env.ASSETS.list({ limit: 1 });
      healthStatus.services.r2 = {
        status: 'healthy',
        connected: true
      };
    } catch (error) {
      healthStatus.services.r2 = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        connected: false
      };
    }

    // Determine overall health status
    const unhealthyServices = Object.values(healthStatus.services)
      .filter((service: any) => service.status === 'unhealthy');
    
    if (unhealthyServices.length > 0) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                       healthStatus.status === 'degraded' ? 200 : 503;

    return c.json(healthStatus, statusCode);
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503);
  }
});

// Detailed health endpoint
health.get('/detailed', async (c) => {
  try {
    const db = new DatabaseService(c.env);
    
    // Get system statistics
    const stats = {
      database: {},
      users: {},
      tasks: {},
      health_logs: {},
      voice_recordings: {},
      system: {}
    };

    // Database stats
    try {
      const tableStats = await db.query(`
        SELECT 
          name as table_name,
          (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=name) as exists
        FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      `);
      stats.database.tables = tableStats.results || [];
    } catch (error) {
      stats.database.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // User stats
    try {
      const userStats = await db.query('SELECT COUNT(*) as total, COUNT(CASE WHEN created_at > ? THEN 1 END) as recent FROM users', 
        [Date.now() - 86400000]);
      stats.users = userStats.results?.[0] || {};
    } catch (error) {
      stats.users.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Task stats
    try {
      const taskStats = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN completed = 1 THEN 1 END) as completed,
          COUNT(CASE WHEN created_at > ? THEN 1 END) as recent
        FROM tasks
      `, [Date.now() - 86400000]);
      stats.tasks = taskStats.results?.[0] || {};
    } catch (error) {
      stats.tasks.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Voice recording stats
    try {
      const voiceStats = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN created_at > ? THEN 1 END) as recent,
          SUM(file_size_bytes) as total_size_bytes
        FROM voice_recordings
      `, [Date.now() - 86400000]);
      stats.voice_recordings = voiceStats.results?.[0] || {};
    } catch (error) {
      stats.voice_recordings.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // System info
    stats.system = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      },
      uptime: process.uptime()
    };

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: stats
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503);
  }
});

// Ready endpoint for Kubernetes
health.get('/ready', async (c) => {
  try {
    const db = new DatabaseService(c.env);
    await db.query('SELECT 1');
    return c.json({ status: 'ready' }, 200);
  } catch (error) {
    return c.json({ status: 'not ready' }, 503);
  }
});

// Liveness probe for Kubernetes
health.get('/live', async (c) => {
  return c.json({ status: 'alive', timestamp: new Date().toISOString() }, 200);
});

export default health;
