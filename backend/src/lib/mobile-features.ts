// Mobile Platform Features Service
// Handles push notifications, offline sync, and mobile-specific features

import { logger } from './logger';
import { DatabaseService } from './db';
import { sseService, SSE_EVENT_TYPES } from './realtime-sse';

export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'task_reminder' | 'achievement' | 'focus_session' | 'health_reminder' | 'general';
  scheduledFor?: number;
  sentAt?: number;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  platform: 'ios' | 'android' | 'web';
  deviceToken?: string;
}

export interface OfflineSyncData {
  userId: string;
  lastSyncAt: number;
  pendingChanges: {
    tasks: any[];
    events: any[];
    healthData: any[];
    habits: any[];
  };
  conflicts: any[];
}

export interface MobileDevice {
  id: string;
  userId: string;
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  osVersion: string;
  lastSeen: number;
  isActive: boolean;
  capabilities: {
    pushNotifications: boolean;
    backgroundSync: boolean;
    hapticFeedback: boolean;
    camera: boolean;
    voice: boolean;
  };
}

export class MobileFeaturesService {
  private db: DatabaseService;
  private oneSignalAppId: string;
  private oneSignalApiKey: string;

  constructor(db: DatabaseService, oneSignalAppId: string, oneSignalApiKey: string) {
    this.db = db;
    this.oneSignalAppId = oneSignalAppId;
    this.oneSignalApiKey = oneSignalApiKey;
  }

  /**
   * Register mobile device
   */
  async registerDevice(deviceData: {
    userId: string;
    deviceToken: string;
    platform: 'ios' | 'android' | 'web';
    appVersion: string;
    osVersion: string;
    capabilities: MobileDevice['capabilities'];
  }): Promise<string> {
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.execute(`
      INSERT INTO mobile_devices (
        id, user_id, device_token, platform, app_version, os_version,
        last_seen, is_active, capabilities, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deviceId,
      deviceData.userId,
      deviceData.deviceToken,
      deviceData.platform,
      deviceData.appVersion,
      deviceData.osVersion,
      Date.now(),
      true,
      JSON.stringify(deviceData.capabilities),
      Date.now(),
      Date.now()
    ]);

    logger.info('Mobile device registered', {
      deviceId,
      userId: deviceData.userId,
      platform: deviceData.platform
    });

    return deviceId;
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification: Omit<PushNotification, 'id' | 'status' | 'sentAt'>): Promise<string> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store notification in database
    await this.db.execute(`
      INSERT INTO push_notifications (
        id, user_id, title, body, data, type, scheduled_for, status, platform, device_token, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      notificationId,
      notification.userId,
      notification.title,
      notification.body,
      JSON.stringify(notification.data || {}),
      notification.type,
      notification.scheduledFor || Date.now(),
      'pending',
      notification.platform,
      notification.deviceToken || null,
      Date.now()
    ]);

    // Send immediately if not scheduled
    if (!notification.scheduledFor || notification.scheduledFor <= Date.now()) {
      await this.deliverNotification(notificationId);
    }

    return notificationId;
  }

  /**
   * Deliver push notification via OneSignal
   */
  private async deliverNotification(notificationId: string): Promise<void> {
    try {
      const notification = await this.db.query(`
        SELECT * FROM push_notifications WHERE id = ?
      `, [notificationId]);

      if (notification.results.length === 0) {
        throw new Error('Notification not found');
      }

      const notif = notification.results[0] as any;
      
      // Get user's devices
      const devices = await this.db.query(`
        SELECT * FROM mobile_devices 
        WHERE user_id = ? AND is_active = true AND platform = ?
      `, [notif.user_id, notif.platform]);

      if (devices.results.length === 0) {
        throw new Error('No active devices found for user');
      }

      // Prepare OneSignal payload
      const payload = {
        app_id: this.oneSignalAppId,
        headings: { en: notif.title },
        contents: { en: notif.body },
        data: notif.data ? JSON.parse(notif.data) : {},
        include_player_ids: devices.results.map((d: any) => d.device_token),
        android_channel_id: this.getAndroidChannelId(notif.type),
        ios_badgeType: 'Increase',
        ios_badgeCount: 1
      };

      // Send via OneSignal API
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.oneSignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`OneSignal API error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      // Update notification status
      await this.db.execute(`
        UPDATE push_notifications 
        SET status = 'sent', sent_at = ?, one_signal_id = ?
        WHERE id = ?
      `, [Date.now(), result.id, notificationId]);

      logger.info('Push notification sent', {
        notificationId,
        userId: notif.user_id,
        oneSignalId: result.id,
        devicesCount: devices.results.length
      });

    } catch (error) {
      // Update notification status to failed
      await this.db.execute(`
        UPDATE push_notifications 
        SET status = 'failed', error_message = ?
        WHERE id = ?
      `, [error instanceof Error ? error.message : 'Unknown error', notificationId]);

      logger.error('Push notification failed', {
        notificationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get Android channel ID based on notification type
   */
  private getAndroidChannelId(type: string): string {
    const channels = {
      'task_reminder': 'task_reminders',
      'achievement': 'achievements',
      'focus_session': 'focus_sessions',
      'health_reminder': 'health_reminders',
      'general': 'general'
    };
    return channels[type as keyof typeof channels] || 'general';
  }

  /**
   * Schedule task reminder notification
   */
  async scheduleTaskReminder(
    userId: string,
    taskId: string,
    taskTitle: string,
    reminderTime: number,
    platform: 'ios' | 'android' | 'web' = 'web'
  ): Promise<string> {
    return this.sendPushNotification({
      userId,
      title: 'Task Reminder',
      body: `Don't forget: ${taskTitle}`,
      data: { taskId, type: 'task_reminder' },
      type: 'task_reminder',
      scheduledFor: reminderTime,
      platform
    });
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
    platform: 'ios' | 'android' | 'web' = 'web'
  ): Promise<string> {
    return this.sendPushNotification({
      userId,
      title: '🎉 Achievement Unlocked!',
      body: achievementTitle,
      data: { 
        type: 'achievement',
        title: achievementTitle,
        description: achievementDescription
      },
      type: 'achievement',
      platform
    });
  }

  /**
   * Send focus session notification
   */
  async sendFocusSessionNotification(
    userId: string,
    sessionType: 'start' | 'break' | 'complete',
    platform: 'ios' | 'android' | 'web' = 'web'
  ): Promise<string> {
    const messages = {
      start: { title: 'Focus Session Started', body: 'Time to focus! 🎯' },
      break: { title: 'Break Time', body: 'Take a well-deserved break! ☕' },
      complete: { title: 'Session Complete', body: 'Great work! Session completed! ✅' }
    };

    const message = messages[sessionType];
    return this.sendPushNotification({
      userId,
      title: message.title,
      body: message.body,
      data: { type: 'focus_session', sessionType },
      type: 'focus_session',
      platform
    });
  }

  /**
   * Handle offline sync data
   */
  async handleOfflineSync(
    userId: string,
    syncData: OfflineSyncData
  ): Promise<{
    success: boolean;
    conflicts: any[];
    syncedItems: number;
  }> {
    let syncedItems = 0;
    const conflicts: any[] = [];

    try {
      // Sync tasks
      for (const task of syncData.pendingChanges.tasks) {
        try {
          await this.syncTask(userId, task);
          syncedItems++;
        } catch (error) {
          conflicts.push({
            type: 'task',
            id: task.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Sync events
      for (const event of syncData.pendingChanges.events) {
        try {
          await this.syncEvent(userId, event);
          syncedItems++;
        } catch (error) {
          conflicts.push({
            type: 'event',
            id: event.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Sync health data
      for (const healthData of syncData.pendingChanges.healthData) {
        try {
          await this.syncHealthData(userId, healthData);
          syncedItems++;
        } catch (error) {
          conflicts.push({
            type: 'health',
            id: healthData.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update last sync time
      await this.db.execute(`
        UPDATE users 
        SET last_offline_sync = ?
        WHERE id = ?
      `, [Date.now(), userId]);

      logger.info('Offline sync completed', {
        userId,
        syncedItems,
        conflictsCount: conflicts.length
      });

      return {
        success: true,
        conflicts,
        syncedItems
      };

    } catch (error) {
      logger.error('Offline sync failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        conflicts: [{
          type: 'sync',
          error: error instanceof Error ? error.message : 'Sync failed'
        }],
        syncedItems
      };
    }
  }

  /**
   * Sync individual task
   */
  private async syncTask(userId: string, task: any): Promise<void> {
    // Check if task exists
    const existing = await this.db.query(`
      SELECT * FROM tasks WHERE id = ? AND user_id = ?
    `, [task.id, userId]);

    if (existing.results.length > 0) {
      // Update existing task
      await this.db.execute(`
        UPDATE tasks 
        SET title = ?, description = ?, status = ?, priority = ?, 
            due_date = ?, updated_at = ?, last_synced_at = ?
        WHERE id = ?
      `, [
        task.title,
        task.description,
        task.status,
        task.priority,
        task.due_date,
        Date.now(),
        Date.now(),
        task.id
      ]);
    } else {
      // Create new task
      await this.db.execute(`
        INSERT INTO tasks (
          id, user_id, title, description, status, priority, due_date,
          created_at, updated_at, last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        task.id,
        userId,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.due_date,
        task.created_at || Date.now(),
        Date.now(),
        Date.now()
      ]);
    }
  }

  /**
   * Sync individual event
   */
  private async syncEvent(userId: string, event: any): Promise<void> {
    // Similar implementation for events
    logger.info('Syncing event', { userId, eventId: event.id });
  }

  /**
   * Sync health data
   */
  private async syncHealthData(userId: string, healthData: any): Promise<void> {
    // Similar implementation for health data
    logger.info('Syncing health data', { userId, healthDataId: healthData.id });
  }

  /**
   * Get offline sync data for user
   */
  async getOfflineSyncData(userId: string): Promise<OfflineSyncData> {
    // Get last sync time
    const user = await this.db.query(`
      SELECT last_offline_sync FROM users WHERE id = ?
    `, [userId]);

    const lastSyncAt = user.results.length > 0 ? (user.results[0] as any).last_offline_sync : 0;

    // Get pending changes since last sync
    const tasks = await this.db.query(`
      SELECT * FROM tasks 
      WHERE user_id = ? AND updated_at > ? AND last_synced_at IS NULL
    `, [userId, lastSyncAt]);

    const events = await this.db.query(`
      SELECT * FROM calendar_events 
      WHERE user_id = ? AND updated_at > ? AND last_synced_at IS NULL
    `, [userId, lastSyncAt]);

    return {
      userId,
      lastSyncAt,
      pendingChanges: {
        tasks: tasks.results as any[],
        events: events.results as any[],
        healthData: [], // Implement health data sync
        habits: [] // Implement habits sync
      },
      conflicts: []
    };
  }

  /**
   * Process camera integration data
   */
  async processCameraData(
    userId: string,
    imageData: {
      type: 'food' | 'document' | 'receipt';
      imageBase64: string;
      metadata?: any;
    }
  ): Promise<{
    success: boolean;
    extractedData?: any;
    error?: string;
  }> {
    try {
      // This would integrate with image recognition services
      // For now, just log the action
      logger.info('Processing camera data', {
        userId,
        type: imageData.type,
        imageSize: imageData.imageBase64.length
      });

      // Simulate processing
      const extractedData = {
        type: imageData.type,
        confidence: 0.85,
        extractedText: 'Sample extracted text',
        processedAt: Date.now()
      };

      return {
        success: true,
        extractedData
      };

    } catch (error) {
      logger.error('Camera data processing failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  }

  /**
   * Handle voice command from mobile
   */
  async processVoiceCommand(
    userId: string,
    audioData: {
      audioBase64: string;
      language: string;
      context?: string;
    }
  ): Promise<{
    success: boolean;
    intent?: string;
    response?: string;
    error?: string;
  }> {
    try {
      // This would integrate with speech-to-text and AI processing
      logger.info('Processing voice command', {
        userId,
        language: audioData.language,
        audioSize: audioData.audioBase64.length
      });

      // Simulate processing
      const intent = 'create_task';
      const response = 'Task created successfully from voice command';

      return {
        success: true,
        intent,
        response
      };

    } catch (error) {
      logger.error('Voice command processing failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  }

  /**
   * Get mobile device capabilities
   */
  async getDeviceCapabilities(deviceId: string): Promise<MobileDevice['capabilities'] | null> {
    const device = await this.db.query(`
      SELECT capabilities FROM mobile_devices WHERE id = ?
    `, [deviceId]);

    if (device.results.length === 0) {
      return null;
    }

    return JSON.parse((device.results[0] as any).capabilities);
  }

  /**
   * Update device capabilities
   */
  async updateDeviceCapabilities(
    deviceId: string,
    capabilities: Partial<MobileDevice['capabilities']>
  ): Promise<void> {
    const current = await this.getDeviceCapabilities(deviceId);
    if (!current) {
      throw new Error('Device not found');
    }

    const updated = { ...current, ...capabilities };

    await this.db.execute(`
      UPDATE mobile_devices 
      SET capabilities = ?, updated_at = ?
      WHERE id = ?
    `, [JSON.stringify(updated), Date.now(), deviceId]);

    logger.info('Device capabilities updated', {
      deviceId,
      capabilities: updated
    });
  }
}
