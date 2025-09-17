// Push Notifications Service with OneSignal Integration
import type { Env } from './env';

export interface PushNotification {
  title: string;
  message: string;
  data?: Record<string, any>;
  url?: string;
  imageUrl?: string;
  userId?: string;
  userIds?: string[];
  segments?: string[];
  tags?: Record<string, string>;
  schedule?: number; // Unix timestamp for scheduled delivery
  priority?: 'high' | 'normal' | 'low';
  category?: 'task' | 'health' | 'achievement' | 'reminder' | 'system' | 'social';
}

export interface OneSignalResponse {
  id: string;
  recipients: number;
  external_id?: string;
  errors?: any[];
}

export class PushNotificationService {
  private appId: string;
  private apiKey: string;
  private baseUrl = 'https://onesignal.com/api/v1';

  constructor(env: Env) {
    this.appId = env.ONESIGNAL_APP_ID;
    this.apiKey = env.ONESIGNAL_API_KEY;
  }

  // Send push notification to specific user
  async sendToUser(userId: string, notification: PushNotification): Promise<OneSignalResponse> {
    return this.sendNotification({
      ...notification,
      userId,
      userIds: [userId]
    });
  }

  // Send push notification to multiple users
  async sendToUsers(userIds: string[], notification: PushNotification): Promise<OneSignalResponse> {
    return this.sendNotification({
      ...notification,
      userIds
    });
  }

  // Send push notification to segment (e.g., 'premium_users', 'german_users')
  async sendToSegment(segment: string, notification: PushNotification): Promise<OneSignalResponse> {
    return this.sendNotification({
      ...notification,
      segments: [segment]
    });
  }

  // Send push notification to users with specific tags
  async sendToTags(tags: Record<string, string>, notification: PushNotification): Promise<OneSignalResponse> {
    return this.sendNotification({
      ...notification,
      tags
    });
  }

  // Core notification sending method
  private async sendNotification(notification: PushNotification): Promise<OneSignalResponse> {
    const payload = this.buildOneSignalPayload(notification);

    const response = await fetch(`${this.baseUrl}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OneSignal API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  // Build OneSignal API payload from our notification interface
  private buildOneSignalPayload(notification: PushNotification): any {
    const payload: any = {
      app_id: this.appId,
      headings: { en: notification.title },
      contents: { en: notification.message }
    };

    // Target specific users
    if (notification.userIds && notification.userIds.length > 0) {
      payload.include_external_user_ids = notification.userIds;
    }

    // Target segments
    if (notification.segments && notification.segments.length > 0) {
      payload.included_segments = notification.segments;
    }

    // Target by tags
    if (notification.tags) {
      payload.filters = Object.entries(notification.tags).map(([key, value]) => ({
        field: 'tag',
        key,
        relation: '=',
        value
      }));
    }

    // Custom data payload
    if (notification.data) {
      payload.data = notification.data;
    }

    // Click action URL
    if (notification.url) {
      payload.url = notification.url;
    }

    // Image/icon
    if (notification.imageUrl) {
      payload.large_icon = notification.imageUrl;
      payload.big_picture = notification.imageUrl;
    }

    // Scheduled delivery
    if (notification.schedule) {
      payload.send_after = new Date(notification.schedule * 1000).toISOString();
    }

    // Priority mapping
    if (notification.priority) {
      payload.priority = notification.priority === 'high' ? 10 : 
                        notification.priority === 'low' ? 1 : 5;
    }

    // Category for notification grouping
    if (notification.category) {
      payload.android_channel_id = notification.category;
      payload.ios_category = notification.category;
    }

    return payload;
  }

  // Create or update user device for push notifications
  async registerDevice(userId: string, deviceData: {
    deviceType: 'ios' | 'android' | 'web';
    deviceToken?: string;
    pushToken?: string;
    language?: string;
    timezone?: string;
    appVersion?: string;
  }): Promise<any> {
    const payload = {
      app_id: this.appId,
      device_type: this.getOneSignalDeviceType(deviceData.deviceType),
      external_user_id: userId,
      language: deviceData.language || 'en',
      timezone: deviceData.timezone ? parseInt(deviceData.timezone) : undefined,
      app_version: deviceData.appVersion,
      identifier: deviceData.deviceToken || deviceData.pushToken
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => 
      (payload as any)[key] === undefined && delete (payload as any)[key]
    );

    const response = await fetch(`${this.baseUrl}/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OneSignal device registration error: ${response.status} ${error}`);
    }

    return response.json();
  }

  // Update user tags (for targeting)
  async updateUserTags(userId: string, tags: Record<string, string>): Promise<void> {
    // First get the player ID for this user
    const players = await this.getUserDevices(userId);
    
    for (const player of players) {
      await fetch(`${this.baseUrl}/players/${player.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.apiKey}`
        },
        body: JSON.stringify({ tags })
      });
    }
  }

  // Get all devices for a user
  private async getUserDevices(userId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/players?app_id=${this.appId}&external_user_id=${userId}`, {
      headers: {
        'Authorization': `Basic ${this.apiKey}`
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.players || [];
  }

  // Map our device types to OneSignal device types
  private getOneSignalDeviceType(deviceType: string): number {
    switch (deviceType) {
      case 'ios': return 0;
      case 'android': return 1;
      case 'web': return 5;
      default: return 5;
    }
  }

  // Predefined notification templates for common use cases
  static getTemplate(type: 'task_reminder' | 'health_checkin' | 'achievement' | 'habit_streak' | 'break_reminder' | 'water_reminder' | 'workout_reminder', data: any): PushNotification {
    switch (type) {
      case 'task_reminder':
        return {
          title: '=� Task Reminder',
          message: `Don't forget: ${data.taskTitle}`,
          data: { taskId: data.taskId, type: 'task_reminder' },
          url: `/tasks/${data.taskId}`,
          category: 'task',
          priority: data.priority === 'high' ? 'high' : 'normal'
        };

      case 'health_checkin':
        return {
          title: '<1 Daily Health Check-in',
          message: 'How are you feeling today? Log your mood and energy!',
          data: { type: 'health_checkin' },
          url: '/health/mood',
          category: 'health',
          priority: 'normal'
        };

      case 'achievement':
        return {
          title: '<� Achievement Unlocked!',
          message: `Congratulations! You earned "${data.badgeName}"`,
          data: { badgeId: data.badgeId, type: 'achievement' },
          url: '/achievements',
          category: 'achievement',
          priority: 'high'
        };

      case 'habit_streak':
        return {
          title: '=% Streak Milestone!',
          message: `Amazing! ${data.streakDays} days of ${data.habitName}!`,
          data: { habitId: data.habitId, streak: data.streakDays, type: 'habit_streak' },
          url: '/habits',
          category: 'achievement',
          priority: 'high'
        };

      case 'break_reminder':
        return {
          title: ' Time for a Break',
          message: `You've been working for ${data.workMinutes} minutes. Take a 5-minute break!`,
          data: { workSession: data.sessionId, type: 'break_reminder' },
          url: '/focus',
          category: 'reminder',
          priority: 'normal'
        };

      case 'water_reminder':
        return {
          title: '=� Hydration Reminder',
          message: 'Time to drink some water! Stay hydrated for better health.',
          data: { type: 'water_reminder' },
          url: '/health/hydration',
          category: 'reminder',
          priority: 'normal'
        };

      case 'workout_reminder':
        return {
          title: '=� Workout Time!',
          message: `Time for your ${data.workoutType || 'workout'}. Let's get moving!`,
          data: { workoutId: data.workoutId, type: 'workout_reminder' },
          url: '/health/exercise',
          category: 'reminder',
          priority: 'normal'
        };

      default:
        throw new Error(`Unknown notification template type: ${type}`);
    }
  }
}

// Helper function to create notification service
export function createNotificationService(env: Env): PushNotificationService {
  return new PushNotificationService(env);
}

// Types for notification events
export type NotificationEvent = 
  | { type: 'task_reminder'; taskId: string; taskTitle: string; priority: 'high' | 'normal' | 'low' }
  | { type: 'health_checkin'; userId: string }
  | { type: 'achievement'; badgeId: string; badgeName: string; userId: string }
  | { type: 'habit_streak'; habitId: string; habitName: string; streakDays: number; userId: string }
  | { type: 'break_reminder'; sessionId: string; workMinutes: number; userId: string }
  | { type: 'water_reminder'; userId: string }
  | { type: 'workout_reminder'; workoutId: string; workoutType: string; userId: string };

// Queue notification for processing
export async function queueNotification(env: Env, event: NotificationEvent): Promise<void> {
  // In a real implementation, you'd use Cloudflare Queues
  // For now, we'll send immediately
  const notificationService = createNotificationService(env);
  
  switch (event.type) {
    case 'task_reminder':
      await notificationService.sendToUser(event.userId || '', 
        PushNotificationService.getTemplate('task_reminder', event)
      );
      break;

    case 'health_checkin':
      await notificationService.sendToUser(event.userId, 
        PushNotificationService.getTemplate('health_checkin', {})
      );
      break;

    case 'achievement':
      await notificationService.sendToUser(event.userId, 
        PushNotificationService.getTemplate('achievement', event)
      );
      break;

    case 'habit_streak':
      await notificationService.sendToUser(event.userId, 
        PushNotificationService.getTemplate('habit_streak', event)
      );
      break;

    case 'break_reminder':
      await notificationService.sendToUser(event.userId, 
        PushNotificationService.getTemplate('break_reminder', event)
      );
      break;

    case 'water_reminder':
      await notificationService.sendToUser(event.userId, 
        PushNotificationService.getTemplate('water_reminder', {})
      );
      break;

    case 'workout_reminder':
      await notificationService.sendToUser(event.userId, 
        PushNotificationService.getTemplate('workout_reminder', event)
      );
      break;
  }
}

// Export alias for backward compatibility
export const NotificationService = PushNotificationService;