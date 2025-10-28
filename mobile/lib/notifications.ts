// Push notifications service for React Native
import * as Device from 'expo-device';
import * as Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from './api';

// Conditional import for Expo Go compatibility
let Notifications: any = null;
try {
  // Only import notifications if not in Expo Go or if supported
  if (Constants.default.appOwnership !== 'expo') {
    Notifications = require('expo-notifications');
  }
} catch (error) {
  console.warn('expo-notifications not available in this environment');
}

export interface PushNotificationSettings {
  taskReminders: boolean;
  focusSessionAlerts: boolean;
  healthReminders: boolean;
  achievements: boolean;
  weeklyReports: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<string | null> {
    if (this.isInitialized) return this.pushToken;

    try {
      // Check if notifications are available
      if (!Notifications) {
        console.warn('Push notifications not available in Expo Go. Use a development build for full functionality.');
        this.isInitialized = true;
        return null;
      }

      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return null;
      }

      // Get push token
      const token = await this.getPushToken();
      this.pushToken = token;
      this.isInitialized = true;

      // Register token with backend
      if (token) {
        await this.registerTokenWithBackend(token);
      }

      // Set up notification handler
      this.setupNotificationHandler();

      return token;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      this.isInitialized = true; // Mark as initialized to prevent retries
      return null;
    }
  }

  /**
   * Get Expo push token
   */
  private async getPushToken(): Promise<string | null> {
    if (!Notifications) return null;
    
    try {
      const projectId = Constants.default.expoConfig?.extra?.eas?.projectId ?? Constants.default.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('No Expo project ID found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        deviceId: Constants.default.installationId,
      });
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }
  }

  /**
   * Set up notification handlers
   */
  private setupNotificationHandler(): void {
    if (!Notifications) return;
    
    // Handle incoming notifications when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const { categoryId } = notification.request.content.data || {};
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
          // Don't show alert for focus session notifications if they're frequent
          shouldShowAlert: categoryId !== 'focus_progress',
        };
      },
    });

    // Set up notification categories for interactive notifications
    this.setupNotificationCategories();
  }

  /**
   * Set up interactive notification categories
   */
  private async setupNotificationCategories(): Promise<void> {
    if (!Notifications) return;
    
    try {
      await Notifications.setNotificationCategoryAsync('task_reminder', [
        {
          identifier: 'complete_task',
          buttonTitle: 'Mark Complete',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'snooze_task',
          buttonTitle: 'Snooze 15min',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('focus_session', [
        {
          identifier: 'extend_session',
          buttonTitle: 'Extend +5min',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'complete_session',
          buttonTitle: 'Complete',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('health_reminder', [
        {
          identifier: 'log_now',
          buttonTitle: 'Log Now',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'remind_later',
          buttonTitle: 'Later',
          options: { opensAppToForeground: false },
        },
      ]);
    } catch (error) {
      console.error('Failed to setup notification categories:', error);
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data: any = {},
    trigger: any
  ): Promise<string | null> {
    if (!Notifications) {
      console.warn('Notifications not available - skipping local notification');
      return null;
    }
    
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: await this.getBadgeCount() + 1,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Schedule task reminder notification
   */
  async scheduleTaskReminder(taskId: string, title: string, dueDate: Date): Promise<string | null> {
    const trigger = {
      type: 'timeInterval',
      seconds: Math.floor((dueDate.getTime() - Date.now()) / 1000),
    };

    return this.scheduleLocalNotification(
      'Task Due Soon',
      `"${title}" is due`,
      {
        taskId,
        categoryId: 'task_reminder',
        type: 'task_reminder',
      },
      trigger
    );
  }

  /**
   * Schedule health reminder notification
   */
  async scheduleHealthReminder(type: 'hydration' | 'mood' | 'exercise', time: Date): Promise<string | null> {
    const messages = {
      hydration: { title: 'Stay Hydrated! 💧', body: 'Time to drink some water' },
      mood: { title: 'Check In 😊', body: 'How are you feeling today?' },
      exercise: { title: 'Move Your Body 🏃', body: 'Time for some activity!' },
    };

    const trigger = {
      type: 'timeInterval',
      seconds: Math.floor((time.getTime() - Date.now()) / 1000),
    };

    return this.scheduleLocalNotification(
      messages[type].title,
      messages[type].body,
      {
        type: 'health_reminder',
        healthType: type,
        categoryId: 'health_reminder',
      },
      trigger
    );
  }

  /**
   * Schedule weekly report notification
   */
  async scheduleWeeklyReport(): Promise<string | null> {
    // Schedule for next Sunday at 9 AM
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(9, 0, 0, 0);

    const trigger = {
      type: 'weekly',
      weekday: 1, // Sunday
      hour: 9,
      minute: 0,
      repeats: true,
    };

    return this.scheduleLocalNotification(
      'Weekly Report 📊',
      'Your productivity report is ready!',
      {
        type: 'weekly_report',
        categoryId: 'weekly_report',
      },
      trigger
    );
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    if (!Notifications) return;
    
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    if (!Notifications) return;
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get badge count
   */
  private async getBadgeCount(): Promise<number> {
    if (!Notifications) return 0;
    
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    if (!Notifications) return;
    
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Get notification settings from backend
   */
  async getNotificationSettings(): Promise<PushNotificationSettings | null> {
    try {
      const response = await apiClient.get('/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return {
        taskReminders: true,
        focusSessionAlerts: true,
        healthReminders: true,
        achievements: true,
        weeklyReports: true,
      };
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Partial<PushNotificationSettings>): Promise<void> {
    try {
      await apiClient.put('/notifications/settings', settings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  /**
   * Handle notification responses (when user taps notification actions)
   */
  setupNotificationResponseHandler(): void {
    if (!Notifications) return;
    
    Notifications.addNotificationResponseReceivedListener((response) => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;

      switch (actionIdentifier) {
        case 'complete_task':
          this.handleCompleteTask(data.taskId);
          break;
        case 'snooze_task':
          this.handleSnoozeTask(data.taskId);
          break;
        case 'extend_session':
          this.handleExtendSession();
          break;
        case 'complete_session':
          this.handleCompleteSession();
          break;
        case 'log_now':
          this.handleLogNow(data.healthType);
          break;
        case 'remind_later':
          this.handleRemindLater(data.healthType);
          break;
        default:
          // Default tap action - open app
          break;
      }
    });
  }

  private async handleCompleteTask(taskId: string): Promise<void> {
    try {
      await apiClient.patch(`/tasks/${taskId}`, { status: 'completed' });
    } catch (error) {
      console.error('Failed to complete task from notification:', error);
    }
  }

  private async handleSnoozeTask(taskId: string): Promise<void> {
    const snoozeTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    try {
      const task = await apiClient.get(`/tasks/${taskId}`);
      await this.scheduleTaskReminder(taskId, task.data.title, snoozeTime);
    } catch (error) {
      console.error('Failed to snooze task:', error);
    }
  }

  private handleExtendSession(): void {
    // This would integrate with focus store to extend current session
    console.log('Extend session requested from notification');
  }

  private handleCompleteSession(): void {
    // This would integrate with focus store to complete current session
    console.log('Complete session requested from notification');
  }

  private handleLogNow(healthType: string): void {
    // This would open the appropriate health logging screen
    console.log(`Log ${healthType} requested from notification`);
  }

  private async handleRemindLater(healthType: string): Promise<void> {
    // Schedule another reminder in 2 hours
    const laterTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await this.scheduleHealthReminder(healthType as any, laterTime);
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;