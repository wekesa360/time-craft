// Notifications store with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../lib/api';
import type { Notification, NotificationPreferences } from '../types';

interface NotificationsState {
  notifications: Notification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationsStore extends NotificationsState {
  // Actions
  registerDevice: (deviceToken: string, platform: string, appVersion: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getPreferences: () => Promise<void>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  sendNotification: (type: string, title: string, message: string, data?: any) => Promise<void>;
  addNotification: (notification: Notification) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultPreferences: NotificationPreferences = {
  taskReminders: true,
  healthReminders: true,
  socialNotifications: true,
  badgeUnlocks: true,
  challengeUpdates: true,
  meetingReminders: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      preferences: defaultPreferences,
      unreadCount: 0,
      isLoading: false,
      error: null,

      // Actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      registerDevice: async (deviceToken, platform, appVersion) => {
        try {
          await apiClient.registerDevice({ deviceToken, platform, appVersion });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to register device',
          });
          throw error;
        }
      },

      fetchNotifications: async () => {
        try {
          set({ isLoading: true, error: null });
          const notifications = await apiClient.getNotificationHistory();
          const unreadCount = notifications.filter(n => !n.isRead).length;
          set({
            notifications,
            unreadCount,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch notifications',
            isLoading: false,
          });
        }
      },

      markAsRead: async (id) => {
        try {
          await apiClient.markNotificationAsRead(id);
          const { notifications } = get();
          const updatedNotifications = notifications.map(n =>
            n.id === id ? { ...n, isRead: true, readAt: Date.now() } : n
          );
          const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
          set({
            notifications: updatedNotifications,
            unreadCount,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to mark notification as read',
          });
          throw error;
        }
      },

      markAllAsRead: async () => {
        try {
          await apiClient.markAllNotificationsAsRead();
          const { notifications } = get();
          const updatedNotifications = notifications.map(n => ({
            ...n,
            isRead: true,
            readAt: Date.now(),
          }));
          set({
            notifications: updatedNotifications,
            unreadCount: 0,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
          });
          throw error;
        }
      },

      getPreferences: async () => {
        try {
          const preferences = await apiClient.getNotificationPreferences();
          set({ preferences });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to get preferences',
          });
        }
      },

      updatePreferences: async (newPreferences) => {
        try {
          const preferences = await apiClient.updateNotificationPreferences(newPreferences);
          set({ preferences });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update preferences',
          });
          throw error;
        }
      },

      sendNotification: async (type, title, message, data) => {
        try {
          await apiClient.sendNotification({ type, title, message, data });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to send notification',
          });
          throw error;
        }
      },

      addNotification: (notification) => {
        const { notifications, unreadCount } = get();
        set({
          notifications: [notification, ...notifications],
          unreadCount: notification.isRead ? unreadCount : unreadCount + 1,
        });
      },
    }),
    {
      name: 'notifications-store',
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);