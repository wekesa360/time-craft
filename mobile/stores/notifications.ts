// Notification settings store with Zustand for React Native
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, type PushNotificationSettings } from '../lib/notifications';

interface NotificationStore {
  // State
  isInitialized: boolean;
  pushToken: string | null;
  isLoading: boolean; // compatibility
  isFetching: boolean;
  isMutating: boolean;
  settings: PushNotificationSettings;
  scheduledNotifications: {
    taskReminders: Record<string, string>; // taskId -> notificationId
    healthReminders: Record<string, string>; // type -> notificationId  
    weeklyReport: string | null;
  };
  
  // Actions
  initialize: () => Promise<void>;
  updateSettings: (settings: Partial<PushNotificationSettings>) => Promise<void>;
  scheduleTaskReminder: (taskId: string, title: string, dueDate: Date) => Promise<void>;
  scheduleHealthReminders: () => Promise<void>;
  scheduleWeeklyReport: () => Promise<void>;
  cancelTaskReminder: (taskId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  clearBadge: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isInitialized: false,
      pushToken: null,
      isLoading: false,
      isFetching: false,
      isMutating: false,
      settings: {
        taskReminders: true,
        focusSessionAlerts: true,
        healthReminders: true,
        achievements: true,
        weeklyReports: true,
      },
      scheduledNotifications: {
        taskReminders: {},
        healthReminders: {},
        weeklyReport: null,
      },

      setLoading: (loading) => {
        set({ isLoading: loading, isMutating: loading });
      },

      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        try {
          set({ isLoading: true, isFetching: true });
          
          // Initialize notification service
          const pushToken = await notificationService.initialize();
          
          // Get settings from backend
          const settings = await notificationService.getNotificationSettings();
          
          // Set up notification response handler
          notificationService.setupNotificationResponseHandler();
          
          set({
            isInitialized: true,
            pushToken,
            settings: settings || state.settings,
            isLoading: false,
            isFetching: false,
          });

          // Schedule recurring notifications
          await get().scheduleHealthReminders();
          await get().scheduleWeeklyReport();
          
        } catch (error) {
          console.error('Failed to initialize notifications:', error);
          set({ isLoading: false, isFetching: false });
        }
      },

      updateSettings: async (newSettings) => {
        const state = get();
        const updatedSettings = { ...state.settings, ...newSettings };
        
        try {
          set({ isLoading: true, isMutating: true });
          
          // Update settings on backend
          await notificationService.updateNotificationSettings(newSettings);
          
          // Cancel and reschedule notifications based on new settings
          if (!updatedSettings.taskReminders) {
            // Cancel all task reminder notifications
            const { taskReminders } = state.scheduledNotifications;
            for (const notificationId of Object.values(taskReminders)) {
              await notificationService.cancelNotification(notificationId);
            }
            set(prev => ({
              ...prev,
              scheduledNotifications: {
                ...prev.scheduledNotifications,
                taskReminders: {},
              },
            }));
          }

          if (!updatedSettings.healthReminders) {
            // Cancel all health reminder notifications
            const { healthReminders } = state.scheduledNotifications;
            for (const notificationId of Object.values(healthReminders)) {
              await notificationService.cancelNotification(notificationId);
            }
            set(prev => ({
              ...prev,
              scheduledNotifications: {
                ...prev.scheduledNotifications,
                healthReminders: {},
              },
            }));
          }

          if (!updatedSettings.weeklyReports && state.scheduledNotifications.weeklyReport) {
            // Cancel weekly report notification
            await notificationService.cancelNotification(state.scheduledNotifications.weeklyReport);
            set(prev => ({
              ...prev,
              scheduledNotifications: {
                ...prev.scheduledNotifications,
                weeklyReport: null,
              },
            }));
          }

          // Reschedule if re-enabled
          if (updatedSettings.healthReminders && !state.settings.healthReminders) {
            await get().scheduleHealthReminders();
          }
          
          if (updatedSettings.weeklyReports && !state.settings.weeklyReports) {
            await get().scheduleWeeklyReport();
          }

          set({ settings: updatedSettings, isLoading: false, isMutating: false });
        } catch (error) {
          console.error('Failed to update notification settings:', error);
          set({ isLoading: false, isMutating: false });
          throw error;
        }
      },

      scheduleTaskReminder: async (taskId, title, dueDate) => {
        const state = get();
        if (!state.settings.taskReminders) return;

        try {
          // Cancel existing reminder for this task
          const existingNotificationId = state.scheduledNotifications.taskReminders[taskId];
          if (existingNotificationId) {
            await notificationService.cancelNotification(existingNotificationId);
          }

          // Schedule new reminder (30 minutes before due date)
          const reminderTime = new Date(dueDate.getTime() - 30 * 60 * 1000);
          if (reminderTime > new Date()) {
            const notificationId = await notificationService.scheduleTaskReminder(
              taskId,
              title,
              reminderTime
            );

            if (notificationId) {
              set(prev => ({
                ...prev,
                scheduledNotifications: {
                  ...prev.scheduledNotifications,
                  taskReminders: {
                    ...prev.scheduledNotifications.taskReminders,
                    [taskId]: notificationId,
                  },
                },
              }));
            }
          }
        } catch (error) {
          console.error('Failed to schedule task reminder:', error);
        }
      },

      scheduleHealthReminders: async () => {
        const state = get();
        if (!state.settings.healthReminders) return;

        try {
          // Cancel existing health reminders
          const { healthReminders } = state.scheduledNotifications;
          for (const notificationId of Object.values(healthReminders)) {
            await notificationService.cancelNotification(notificationId);
          }

          const newHealthReminders: Record<string, string> = {};

          // Schedule hydration reminder for every 4 hours during awake time
          const hydrationTimes = [10, 14, 18, 22]; // 10am, 2pm, 6pm, 10pm
          for (const hour of hydrationTimes) {
            const reminderTime = new Date();
            reminderTime.setHours(hour, 0, 0, 0);
            if (reminderTime < new Date()) {
              reminderTime.setDate(reminderTime.getDate() + 1);
            }

            const notificationId = await notificationService.scheduleHealthReminder(
              'hydration',
              reminderTime
            );
            if (notificationId) {
              newHealthReminders[`hydration_${hour}`] = notificationId;
            }
          }

          // Schedule daily mood check-in at 8pm
          const moodTime = new Date();
          moodTime.setHours(20, 0, 0, 0);
          if (moodTime < new Date()) {
            moodTime.setDate(moodTime.getDate() + 1);
          }

          const moodNotificationId = await notificationService.scheduleHealthReminder(
            'mood',
            moodTime
          );
          if (moodNotificationId) {
            newHealthReminders.mood = moodNotificationId;
          }

          // Schedule exercise reminder at 7am (Monday, Wednesday, Friday)
          const exerciseTime = new Date();
          exerciseTime.setHours(7, 0, 0, 0);
          const exerciseNotificationId = await notificationService.scheduleHealthReminder(
            'exercise',
            exerciseTime
          );
          if (exerciseNotificationId) {
            newHealthReminders.exercise = exerciseNotificationId;
          }

          set(prev => ({
            ...prev,
            scheduledNotifications: {
              ...prev.scheduledNotifications,
              healthReminders: newHealthReminders,
            },
          }));
        } catch (error) {
          console.error('Failed to schedule health reminders:', error);
        }
      },

      scheduleWeeklyReport: async () => {
        const state = get();
        if (!state.settings.weeklyReports) return;

        try {
          // Cancel existing weekly report notification
          if (state.scheduledNotifications.weeklyReport) {
            await notificationService.cancelNotification(state.scheduledNotifications.weeklyReport);
          }

          const notificationId = await notificationService.scheduleWeeklyReport();
          if (notificationId) {
            set(prev => ({
              ...prev,
              scheduledNotifications: {
                ...prev.scheduledNotifications,
                weeklyReport: notificationId,
              },
            }));
          }
        } catch (error) {
          console.error('Failed to schedule weekly report:', error);
        }
      },

      cancelTaskReminder: async (taskId) => {
        const state = get();
        const notificationId = state.scheduledNotifications.taskReminders[taskId];
        
        if (notificationId) {
          try {
            await notificationService.cancelNotification(notificationId);
            set(prev => {
              const { [taskId]: removed, ...remainingReminders } = prev.scheduledNotifications.taskReminders;
              return {
                ...prev,
                scheduledNotifications: {
                  ...prev.scheduledNotifications,
                  taskReminders: remainingReminders,
                },
              };
            });
          } catch (error) {
            console.error('Failed to cancel task reminder:', error);
          }
        }
      },

      cancelAllNotifications: async () => {
        try {
          await notificationService.cancelAllNotifications();
          set(prev => ({
            ...prev,
            scheduledNotifications: {
              taskReminders: {},
              healthReminders: {},
              weeklyReport: null,
            },
          }));
        } catch (error) {
          console.error('Failed to cancel all notifications:', error);
        }
      },

      clearBadge: async () => {
        try {
          await notificationService.clearBadge();
        } catch (error) {
          console.error('Failed to clear badge:', error);
        }
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        scheduledNotifications: state.scheduledNotifications,
      }),
    }
  )
);