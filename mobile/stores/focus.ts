// Focus session store with Zustand for React Native
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform, Linking, Alert } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { apiClient, notify } from '../lib/api';
import type { FocusSession } from '../types';

interface FocusStore {
  // State
  currentSession: FocusSession | null;
  sessions: FocusSession[];
  isLoading: boolean; // compatibility
  isFetching: boolean;
  isMutating: boolean;
  timeRemaining: number;
  isTimerActive: boolean;
  isPaused: boolean;
  
  // Settings
  pomodoroSettings: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  };
  
  // Actions
  startFocusSession: (data: {
    duration: number;
    taskId?: string;
    type: 'pomodoro' | 'deep_work' | 'break';
  }) => Promise<void>;
  completeFocusSession: (data: { 
    actualDuration: number; 
    wasProductive: boolean; 
    notes?: string;
  }) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  cancelSession: () => void;
  fetchSessions: () => Promise<void>;
  setTimeRemaining: (time: number) => void;
  setTimerActive: (active: boolean) => void;
  updatePomodoroSettings: (settings: Partial<FocusStore['pomodoroSettings']>) => void;
  setLoading: (loading: boolean) => void;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      sessions: [],
      isLoading: false,
      isFetching: false,
      isMutating: false,
      timeRemaining: 0,
      isTimerActive: false,
      isPaused: false,
      
      pomodoroSettings: {
        workDuration: 25, // minutes
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
      },

      // Actions
      setLoading: (isLoading) => {
        set({ isLoading, isMutating: isLoading });
      },

      setTimeRemaining: (timeRemaining) => {
        set({ timeRemaining });
      },

      setTimerActive: (isTimerActive) => {
        set({ isTimerActive });
      },

      updatePomodoroSettings: (newSettings) => {
        const currentSettings = get().pomodoroSettings;
        set({ 
          pomodoroSettings: { ...currentSettings, ...newSettings } 
        });
      },

      startFocusSession: async (data) => {
        try {
          set({ isLoading: true, isMutating: true });
          
          // Cancel any existing session
          const current = get().currentSession;
          if (current) {
            await get().cancelSession();
          }
          
          // Create new session via API
          const session = await apiClient.startFocusSession(data);
          
          // Set up local timer state
          const durationInSeconds = data.duration * 60;
          set({
            currentSession: session,
            timeRemaining: durationInSeconds,
            isTimerActive: true,
            isPaused: false,
            isLoading: false,
            isMutating: false,
          });

          // Keep device awake and lock orientation during active session
          try {
            await activateKeepAwakeAsync();
          } catch {}
          try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          } catch {}

          // Schedule notification for session completion
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Focus Session Complete! 🎉',
              body: `Your ${data.type} session has finished. Great job!`,
              sound: 'default',
            },
            trigger: {
              type: 'timeInterval',
              seconds: durationInSeconds,
            } as Notifications.TimeIntervalTriggerInput,
          });

          // Haptic feedback
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          
          notify.success(`${data.type} session started!`);

          // Optional: Prompt user to enable OS Do Not Disturb for fewer interruptions (cannot be auto-toggled)
          if (Platform.OS === 'android') {
            Alert.alert(
              'Reduce interruptions',
              'For the best focus, enable Do Not Disturb in system settings while the session runs.',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => {
                    // Attempt to open Android DND settings; may vary by device
                    const intents = [
                      'android.settings.ZEN_MODE_SETTINGS',
                      'android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS',
                    ];
                    // Try the first available intent via Linking
                    for (const intent of intents) {
                      const url = `intent:#Intent;action=${intent};end`;
                      Linking.openURL(url).catch(() => {});
                    }
                  },
                },
              ]
            );
          }
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          console.error('Failed to start focus session:', error);
          notify.error('Failed to start focus session');
          throw error;
        }
      },

      completeFocusSession: async (data) => {
        try {
          const currentSession = get().currentSession;
          if (!currentSession) return;

          set({ isLoading: true, isMutating: true });
          
          // Complete session via API
          const completedSession = await apiClient.completeFocusSession(
            currentSession.id,
            data
          );
          
          // Update local state
          const sessions = get().sessions;
          set({
            currentSession: null,
            sessions: [completedSession, ...sessions],
            timeRemaining: 0,
            isTimerActive: false,
            isPaused: false,
            isLoading: false,
            isMutating: false,
          });

          // Cancel any pending notifications
          await Notifications.cancelAllScheduledNotificationsAsync();
          // Release keep-awake and unlock orientation
          try { deactivateKeepAwake(); } catch {}
          try { await ScreenOrientation.unlockAsync(); } catch {}
          
          // Haptic feedback
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          notify.success('Focus session completed!');
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          console.error('Failed to complete focus session:', error);
          notify.error('Failed to complete session');
          throw error;
        }
      },

      pauseSession: () => {
        const { currentSession, isTimerActive } = get();
        if (!currentSession || !isTimerActive) return;

        set({ 
          isPaused: true,
          isTimerActive: false 
        });

        // Cancel scheduled notifications
        Notifications.cancelAllScheduledNotificationsAsync();
        // Allow device to sleep while paused
        try { deactivateKeepAwake(); } catch {}
        
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },

      resumeSession: async () => {
        const { currentSession, timeRemaining, isPaused } = get();
        if (!currentSession || !isPaused) return;

        set({ 
          isPaused: false,
          isTimerActive: true 
        });

        // Schedule notification for remaining time
        if (timeRemaining > 0) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Focus Session Complete! 🎉',
              body: `Your ${currentSession.sessionType} session has finished. Great job!`,
              sound: 'default',
            },
            trigger: {
              type: 'timeInterval',
              seconds: timeRemaining,
            } as Notifications.TimeIntervalTriggerInput,
          });
        }

        // Re-apply keep-awake
        try { await activateKeepAwakeAsync(); } catch {}

        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },

      cancelSession: async () => {
        const currentSession = get().currentSession;
        if (!currentSession) return;

        try {
          // Note: You might want to add a cancel endpoint to your API
          // For now, we'll just complete it with minimal data
          await get().completeFocusSession({
            actualDuration: 0,
            wasProductive: false,
            notes: 'Session cancelled',
          });

          // Cancel notifications
          await Notifications.cancelAllScheduledNotificationsAsync();
          // Release keep-awake and unlock orientation
          try { deactivateKeepAwake(); } catch {}
          try { await ScreenOrientation.unlockAsync(); } catch {}
          
          // Haptic feedback
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          
        } catch (error) {
          console.error('Failed to cancel session:', error);
          // Reset state anyway
          set({
            currentSession: null,
            timeRemaining: 0,
            isTimerActive: false,
            isPaused: false,
          });
          try { deactivateKeepAwake(); } catch {}
          try { await ScreenOrientation.unlockAsync(); } catch {}
        }
      },

      fetchSessions: async () => {
        try {
          set({ isLoading: true, isFetching: true });
          const sessions = await apiClient.getFocusSessions();
          set({ 
            sessions,
            isLoading: false,
            isFetching: false,
          });
        } catch (error) {
          set({ isLoading: false, isFetching: false });
          console.error('Failed to fetch focus sessions:', error);
          notify.error('Failed to load focus sessions');
        }
      },
    }),
    {
      name: 'focus-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        pomodoroSettings: state.pomodoroSettings,
      }),
    }
  )
);