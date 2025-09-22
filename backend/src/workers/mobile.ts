// Mobile Features API Endpoints
// Handles push notifications, offline sync, and mobile-specific features

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../lib/env';
import { DatabaseService } from '../lib/db';
import { MobileFeaturesService } from '../lib/mobile-features';

const mobile = new Hono<{ Bindings: Env }>();

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

// ========== DEVICE REGISTRATION ==========

// POST /mobile/device/register - Register mobile device
mobile.post('/device/register',
  zValidator('json', z.object({
    deviceToken: z.string(),
    platform: z.enum(['ios', 'android', 'web']),
    appVersion: z.string(),
    osVersion: z.string(),
    capabilities: z.object({
      pushNotifications: z.boolean(),
      backgroundSync: z.boolean(),
      hapticFeedback: z.boolean(),
      camera: z.boolean(),
      voice: z.boolean()
    })
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const deviceData = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const mobileService = new MobileFeaturesService(
      db,
      c.env.ONESIGNAL_APP_ID,
      c.env.ONESIGNAL_API_KEY
    );

    try {
      const deviceId = await mobileService.registerDevice({
        userId: auth.userId,
        ...deviceData
      });
      
      return c.json({
        success: true,
        deviceId,
        message: 'Device registered successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Device registration failed'
      }, 500);
    }
  }
);

// PUT /mobile/device/:deviceId/capabilities - Update device capabilities
mobile.put('/device/:deviceId/capabilities',
  zValidator('json', z.object({
    capabilities: z.object({
      pushNotifications: z.boolean().optional(),
      backgroundSync: z.boolean().optional(),
      hapticFeedback: z.boolean().optional(),
      camera: z.boolean().optional(),
      voice: z.boolean().optional()
    })
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const deviceId = c.req.param('deviceId');
    const { capabilities } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const mobileService = new MobileFeaturesService(
      db,
      c.env.ONESIGNAL_APP_ID,
      c.env.ONESIGNAL_API_KEY
    );

    try {
      await mobileService.updateDeviceCapabilities(deviceId, capabilities);
      
      return c.json({
        success: true,
        message: 'Device capabilities updated successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      }, 500);
    }
  }
);

// ========== PUSH NOTIFICATIONS ==========

// POST /mobile/notifications/send - Send push notification
mobile.post('/notifications/send',
  zValidator('json', z.object({
    userId: z.string(),
    title: z.string(),
    body: z.string(),
    data: z.record(z.any()).optional(),
    type: z.enum(['task_reminder', 'achievement', 'focus_session', 'health_reminder', 'general']),
    platform: z.enum(['ios', 'android', 'web']),
    scheduledFor: z.number().optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notification = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const mobileService = new MobileFeaturesService(
      db,
      c.env.ONESIGNAL_APP_ID,
      c.env.ONESIGNAL_API_KEY
    );

    try {
      const notificationId = await mobileService.sendPushNotification(notification);
      
      return c.json({
        success: true,
        notificationId,
        message: 'Notification sent successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed'
      }, 500);
    }
  }
);

// POST /mobile/notifications/task-reminder - Schedule task reminder
mobile.post('/notifications/task-reminder',
  zValidator('json', z.object({
    taskId: z.string(),
    taskTitle: z.string(),
    reminderTime: z.number(),
    platform: z.enum(['ios', 'android', 'web']).optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { taskId, taskTitle, reminderTime, platform = 'web' } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const mobileService = new MobileFeaturesService(
      db,
      c.env.ONESIGNAL_APP_ID,
      c.env.ONESIGNAL_API_KEY
    );

    try {
      const notificationId = await mobileService.scheduleTaskReminder(
        auth.userId,
        taskId,
        taskTitle,
        reminderTime,
        platform
      );
      
      return c.json({
        success: true,
        notificationId,
        message: 'Task reminder scheduled successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Reminder scheduling failed'
      }, 500);
    }
  }
);

// POST /mobile/notifications/achievement - Send achievement notification
mobile.post('/notifications/achievement',
  zValidator('json', z.object({
    achievementTitle: z.string(),
    achievementDescription: z.string(),
    platform: z.enum(['ios', 'android', 'web']).optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { achievementTitle, achievementDescription, platform = 'web' } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const mobileService = new MobileFeaturesService(
      db,
      c.env.ONESIGNAL_APP_ID,
      c.env.ONESIGNAL_API_KEY
    );

    try {
      const notificationId = await mobileService.sendAchievementNotification(
        auth.userId,
        achievementTitle,
        achievementDescription,
        platform
      );
      
      return c.json({
        success: true,
        notificationId,
        message: 'Achievement notification sent successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed'
      }, 500);
    }
  }
);

// ========== OFFLINE SYNC ==========

// POST /mobile/sync/upload - Upload offline sync data
mobile.post('/sync/upload',
  zValidator('json', z.object({
    lastSyncAt: z.number(),
    pendingChanges: z.object({
      tasks: z.array(z.any()),
      events: z.array(z.any()),
      healthData: z.array(z.any()),
      habits: z.array(z.any())
    }),
    conflicts: z.array(z.any()).optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const syncData = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const mobileService = new MobileFeaturesService(
      db,
      c.env.ONESIGNAL_APP_ID,
      c.env.ONESIGNAL_API_KEY
    );

    try {
      const result = await mobileService.handleOfflineSync(auth.userId, syncData);
      
      return c.json({
        success: result.success,
        syncedItems: result.syncedItems,
        conflicts: result.conflicts,
        message: result.success ? 'Sync completed successfully' : 'Sync completed with conflicts'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }, 500);
    }
  }
);

// GET /mobile/sync/download - Download offline sync data
mobile.get('/sync/download', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);
  const mobileService = new MobileFeaturesService(
    db,
    c.env.ONESIGNAL_APP_ID,
    c.env.ONESIGNAL_API_KEY
  );

  try {
    const syncData = await mobileService.getOfflineSyncData(auth.userId);
    
    return c.json({
      success: true,
      data: syncData
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    }, 500);
  }
});

// ========== CAMERA INTEGRATION ==========

// POST /mobile/camera/process - Process camera data
mobile.post('/camera/process',
  zValidator('json', z.object({
    type: z.enum(['food', 'document', 'receipt']),
    imageBase64: z.string(),
    metadata: z.record(z.any()).optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const imageData = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const mobileService = new MobileFeaturesService(
      db,
      c.env.ONESIGNAL_APP_ID,
      c.env.ONESIGNAL_API_KEY
    );

    try {
      const result = await mobileService.processCameraData(auth.userId, imageData);
      
      return c.json({
        success: result.success,
        extractedData: result.extractedData,
        error: result.error
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      }, 500);
    }
  }
);

// ========== VOICE COMMANDS ==========

// POST /mobile/voice/process - Process voice command
mobile.post('/voice/process',
  zValidator('json', z.object({
    audioBase64: z.string(),
    language: z.string().optional(),
    context: z.string().optional()
  })),
  async (c) => {
    const auth = await getUserFromToken(c);
    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const audioData = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const mobileService = new MobileFeaturesService(
      db,
      c.env.ONESIGNAL_APP_ID,
      c.env.ONESIGNAL_API_KEY
    );

    try {
      const result = await mobileService.processVoiceCommand(auth.userId, audioData);
      
      return c.json({
        success: result.success,
        intent: result.intent,
        response: result.response,
        error: result.error
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      }, 500);
    }
  }
);

// ========== DEVICE CAPABILITIES ==========

// GET /mobile/device/:deviceId/capabilities - Get device capabilities
mobile.get('/device/:deviceId/capabilities', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const deviceId = c.req.param('deviceId');
  const db = new DatabaseService(c.env);
  const mobileService = new MobileFeaturesService(
    db,
    c.env.ONESIGNAL_APP_ID,
    c.env.ONESIGNAL_API_KEY
  );

  try {
    const capabilities = await mobileService.getDeviceCapabilities(deviceId);
    
    if (!capabilities) {
      return c.json({ error: 'Device not found' }, 404);
    }
    
    return c.json({
      success: true,
      capabilities
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get capabilities'
    }, 500);
  }
});

// ========== MOBILE ANALYTICS ==========

// GET /mobile/analytics/usage - Get mobile usage analytics
mobile.get('/analytics/usage', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);

  try {
    // Get device statistics
    const devices = await db.query(`
      SELECT platform, COUNT(*) as count, 
             AVG(last_seen) as avg_last_seen
      FROM mobile_devices 
      WHERE user_id = ? AND is_active = true
      GROUP BY platform
    `, [auth.userId]);

    // Get notification statistics
    const notifications = await db.query(`
      SELECT type, status, COUNT(*) as count
      FROM push_notifications 
      WHERE user_id = ? AND created_at > ?
      GROUP BY type, status
    `, [auth.userId, Date.now() - 30 * 24 * 60 * 60 * 1000]); // Last 30 days

    // Get sync statistics
    const syncStats = await db.query(`
      SELECT COUNT(*) as sync_count, MAX(last_offline_sync) as last_sync
      FROM users 
      WHERE id = ?
    `, [auth.userId]);

    return c.json({
      success: true,
      data: {
        devices: devices.results,
        notifications: notifications.results,
        sync: syncStats.results[0]
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analytics failed'
    }, 500);
  }
});

// ========== MOBILE SETTINGS ==========

// GET /mobile/settings - Get mobile-specific settings
mobile.get('/settings', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);

  try {
    const settings = await db.query(`
      SELECT mobile_settings FROM users WHERE id = ?
    `, [auth.userId]);

    const mobileSettings = settings.results.length > 0 
      ? JSON.parse((settings.results[0] as any).mobile_settings || '{}')
      : {};

    return c.json({
      success: true,
      settings: {
        pushNotifications: true,
        backgroundSync: true,
        hapticFeedback: true,
        cameraIntegration: true,
        voiceCommands: true,
        ...mobileSettings
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Settings retrieval failed'
    }, 500);
  }
});

// PUT /mobile/settings - Update mobile-specific settings
mobile.put('/settings',
  zValidator('json', z.object({
    pushNotifications: z.boolean().optional(),
    backgroundSync: z.boolean().optional(),
    hapticFeedback: z.boolean().optional(),
    cameraIntegration: z.boolean().optional(),
    voiceCommands: z.boolean().optional()
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
        SET mobile_settings = ?, updated_at = ?
        WHERE id = ?
      `, [JSON.stringify(settings), Date.now(), auth.userId]);
      
      return c.json({
        success: true,
        message: 'Mobile settings updated successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Settings update failed'
      }, 500);
    }
  }
);

export default mobile;
