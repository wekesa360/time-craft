// Push Notifications Worker - OneSignal Integration
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../lib/env';
import { PushNotificationService, createNotificationService, queueNotification } from '../lib/notifications';
import { DatabaseService, UserRepository } from '../lib/db';
import type { SupportedLanguage } from '../types/database';

const notifications = new Hono<{ Bindings: Env }>();

// Authentication middleware
const getUserFromToken = async (c: any): Promise<{ userId: string; language?: SupportedLanguage } | null> => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    return { 
      userId: payload.userId as string,
      language: (payload.preferredLanguage as SupportedLanguage) || 'en'
    };
  } catch {
    return null;
  }
};

// ========== DEVICE REGISTRATION ==========

// POST /notifications/register-device - Register device for push notifications
const registerDeviceSchema = z.object({
  deviceType: z.enum(['ios', 'android', 'web']),
  deviceToken: z.string().optional(),
  pushToken: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  appVersion: z.string().optional()
});

notifications.post('/register-device', zValidator('json', registerDeviceSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const deviceData = c.req.valid('json');
    const notificationService = createNotificationService(c.env);

    // Register device with OneSignal
    const result = await notificationService.registerDevice(auth.userId, {
      ...deviceData,
      language: deviceData.language || auth.language || 'en'
    });

    // Store device registration in our database for tracking
    const db = new DatabaseService(c.env);
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.query(`
      INSERT OR REPLACE INTO user_devices (
        id, user_id, device_type, device_token, onesignal_player_id,
        language, timezone, app_version, registered_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deviceId, auth.userId, deviceData.deviceType, 
      deviceData.deviceToken || deviceData.pushToken,
      result.id, deviceData.language, deviceData.timezone,
      deviceData.appVersion, Date.now(), Date.now()
    ]);

    return c.json({
      message: 'Device registered successfully',
      deviceId,
      playerId: result.id,
      success: result.success !== false
    });
  } catch (error) {
    console.error('Device registration error:', error);
    return c.json({ error: 'Failed to register device' }, 500);
  }
});

// ========== NOTIFICATION PREFERENCES ==========

// GET /notifications/preferences - Get user notification preferences
notifications.get('/preferences', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    const prefs = await db.query(`
      SELECT * FROM notification_preferences 
      WHERE user_id = ?
    `, [auth.userId]);

    const defaultPreferences = {
      taskReminders: true,
      healthCheckins: true,
      achievements: true,
      habitStreaks: true,
      breakReminders: true,
      waterReminders: true,
      workoutReminders: true,
      meetingReminders: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'UTC'
    };

    const userPrefs = prefs.results?.[0];
    if (userPrefs) {
      return c.json({
        preferences: {
          ...defaultPreferences,
          ...JSON.parse(userPrefs.preferences || '{}')
        }
      });
    } else {
      return c.json({ preferences: defaultPreferences });
    }
  } catch (error) {
    console.error('Get preferences error:', error);
    return c.json({ error: 'Failed to get preferences' }, 500);
  }
});

// PUT /notifications/preferences - Update notification preferences
const preferencesSchema = z.object({
  taskReminders: z.boolean().optional(),
  healthCheckins: z.boolean().optional(),
  achievements: z.boolean().optional(),
  habitStreaks: z.boolean().optional(),
  breakReminders: z.boolean().optional(),
  waterReminders: z.boolean().optional(),
  workoutReminders: z.boolean().optional(),
  meetingReminders: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  timezone: z.string().optional()
});

notifications.put('/preferences', zValidator('json', preferencesSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const preferences = c.req.valid('json');
    const db = new DatabaseService(c.env);

    await db.query(`
      INSERT OR REPLACE INTO notification_preferences (
        user_id, preferences, updated_at
      ) VALUES (?, ?, ?)
    `, [auth.userId, JSON.stringify(preferences), Date.now()]);

    // Update OneSignal tags based on preferences
    const notificationService = createNotificationService(c.env);
    const tags: Record<string, string> = {};
    
    // Convert preferences to tags for targeting
    Object.entries(preferences).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        tags[key] = value.toString();
      } else if (typeof value === 'string') {
        tags[key] = value;
      }
    });

    await notificationService.updateUserTags(auth.userId, tags);

    return c.json({
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

// ========== SEND NOTIFICATIONS ==========

// POST /notifications/send - Send custom notification (admin only)
const sendNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  targetType: z.enum(['user', 'users', 'segment', 'all']),
  targetValue: z.string().optional(),
  targetUsers: z.array(z.string()).optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  schedule: z.number().optional(),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  category: z.enum(['task', 'health', 'achievement', 'reminder', 'system', 'social']).optional(),
  data: z.record(z.any()).optional()
});

notifications.post('/send', zValidator('json', sendNotificationSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user is admin
  const userRepo = new UserRepository(c.env);
  const user = await userRepo.findById(auth.userId);
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
    const notificationData = c.req.valid('json');
    const notificationService = createNotificationService(c.env);

    let result;
    switch (notificationData.targetType) {
      case 'user':
        if (!notificationData.targetValue) {
          return c.json({ error: 'Target user ID required' }, 400);
        }
        result = await notificationService.sendToUser(notificationData.targetValue, notificationData);
        break;

      case 'users':
        if (!notificationData.targetUsers || notificationData.targetUsers.length === 0) {
          return c.json({ error: 'Target user IDs required' }, 400);
        }
        result = await notificationService.sendToUsers(notificationData.targetUsers, notificationData);
        break;

      case 'segment':
        if (!notificationData.targetValue) {
          return c.json({ error: 'Target segment required' }, 400);
        }
        result = await notificationService.sendToSegment(notificationData.targetValue, notificationData);
        break;

      case 'all':
        result = await notificationService.sendToSegment('All', notificationData);
        break;

      default:
        return c.json({ error: 'Invalid target type' }, 400);
    }

    return c.json({
      message: 'Notification sent successfully',
      notificationId: result.id,
      recipients: result.recipients
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// ========== NOTIFICATION TEMPLATES ==========

// GET /notifications/templates - Get available notification templates
notifications.get('/templates', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const templates = [
    {
      type: 'task_reminder',
      name: 'Task Reminder',
      description: 'Remind user about pending tasks',
      requiredData: ['taskTitle', 'taskId'],
      optionalData: ['priority']
    },
    {
      type: 'health_checkin',
      name: 'Daily Health Check-in',
      description: 'Daily mood and energy check-in reminder',
      requiredData: [],
      optionalData: []
    },
    {
      type: 'achievement',
      name: 'Achievement Unlocked',
      description: 'Celebrate user achievements and badges',
      requiredData: ['badgeName', 'badgeId'],
      optionalData: []
    },
    {
      type: 'habit_streak',
      name: 'Habit Streak Milestone',
      description: 'Celebrate habit consistency streaks',
      requiredData: ['habitName', 'streakDays'],
      optionalData: ['habitId']
    },
    {
      type: 'break_reminder',
      name: 'Break Reminder',
      description: 'Remind user to take breaks during work',
      requiredData: ['workMinutes'],
      optionalData: ['sessionId']
    },
    {
      type: 'water_reminder',
      name: 'Hydration Reminder',
      description: 'Remind user to drink water',
      requiredData: [],
      optionalData: []
    },
    {
      type: 'workout_reminder',
      name: 'Workout Reminder',
      description: 'Remind user about scheduled workouts',
      requiredData: [],
      optionalData: ['workoutType', 'workoutId']
    }
  ];

  return c.json({ templates });
});

// POST /notifications/template - Send notification using template
const templateNotificationSchema = z.object({
  templateType: z.enum(['task_reminder', 'health_checkin', 'achievement', 'habit_streak', 'break_reminder', 'water_reminder', 'workout_reminder']),
  targetUserId: z.string().min(1),
  data: z.record(z.any()).optional(),
  schedule: z.number().optional()
});

notifications.post('/template', zValidator('json', templateNotificationSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { templateType, targetUserId, data = {}, schedule } = c.req.valid('json');
    const notificationService = createNotificationService(c.env);

    // Generate notification from template
    const notification = PushNotificationService.getTemplate(templateType, data);
    
    if (schedule) {
      notification.schedule = schedule;
    }

    const result = await notificationService.sendToUser(targetUserId, notification);

    return c.json({
      message: 'Template notification sent successfully',
      notificationId: result.id,
      recipients: result.recipients
    });
  } catch (error) {
    console.error('Template notification error:', error);
    return c.json({ error: 'Failed to send template notification' }, 500);
  }
});

// ========== NOTIFICATION HISTORY ==========

// GET /notifications/history - Get user's notification history
notifications.get('/history', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const limit = Math.min(Number(c.req.query('limit')) || 50, 100);
    const offset = Number(c.req.query('offset')) || 0;

    const db = new DatabaseService(c.env);
    const history = await db.query(`
      SELECT * FROM notification_history 
      WHERE user_id = ?
      ORDER BY sent_at DESC
      LIMIT ? OFFSET ?
    `, [auth.userId, limit, offset]);

    const notifications = (history.results || []).map((notif: any) => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      category: notif.category,
      sentAt: notif.sent_at,
      opened: Boolean(notif.opened_at),
      openedAt: notif.opened_at,
      data: notif.data ? JSON.parse(notif.data) : null
    }));

    return c.json({
      notifications,
      pagination: {
        limit,
        offset,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Notification history error:', error);
    return c.json({ error: 'Failed to get notification history' }, 500);
  }
});

// POST /notifications/:id/opened - Mark notification as opened
notifications.post('/:id/opened', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const notificationId = c.req.param('id');
    const db = new DatabaseService(c.env);

    await db.query(`
      UPDATE notification_history 
      SET opened_at = ? 
      WHERE id = ? AND user_id = ?
    `, [Date.now(), notificationId, auth.userId]);

    return c.json({ message: 'Notification marked as opened' });
  } catch (error) {
    console.error('Mark notification opened error:', error);
    return c.json({ error: 'Failed to mark notification as opened' }, 500);
  }
});

// ========== ANALYTICS ==========

// GET /notifications/analytics - Get notification analytics (admin only)
notifications.get('/analytics', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user is admin
  const userRepo = new UserRepository(c.env);
  const user = await userRepo.findById(auth.userId);
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
    const db = new DatabaseService(c.env);
    const timeframe = c.req.query('timeframe') || '30d';
    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const [sendStats, openStats, deviceStats] = await Promise.all([
      db.query(`
        SELECT category, COUNT(*) as sent_count
        FROM notification_history 
        WHERE sent_at > ?
        GROUP BY category
      `, [startDate]),

      db.query(`
        SELECT category, COUNT(*) as opened_count
        FROM notification_history 
        WHERE sent_at > ? AND opened_at IS NOT NULL
        GROUP BY category
      `, [startDate]),

      db.query(`
        SELECT device_type, COUNT(*) as device_count
        FROM user_devices
        GROUP BY device_type
      `)
    ]);

    return c.json({
      analytics: {
        timeframe: `${days} days`,
        sent: sendStats.results || [],
        opened: openStats.results || [],
        devices: deviceStats.results || [],
        generatedAt: Date.now()
      }
    });
  } catch (error) {
    console.error('Notification analytics error:', error);
    return c.json({ error: 'Failed to get notification analytics' }, 500);
  }
});

export default notifications;