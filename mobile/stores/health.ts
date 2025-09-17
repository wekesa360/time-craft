// Health tracking store with Zustand for React Native
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, notify } from '../lib/api';
import type { 
  HealthLog, 
  ExerciseData, 
  NutritionData, 
  MoodData, 
  HydrationData, 
  HealthState 
} from '../types';

interface HealthStore extends HealthState {
  // Actions
  fetchHealthLogs: (params?: { type?: string; startDate?: number; endDate?: number }) => Promise<void>;
  logExercise: (data: ExerciseData) => Promise<void>;
  logNutrition: (data: NutritionData) => Promise<void>;
  logMood: (data: MoodData) => Promise<void>;
  logHydration: (data: HydrationData) => Promise<void>;
  fetchHealthSummary: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  refreshHealthData: () => Promise<void>;
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      logs: [],
      isLoading: false,
      summary: {
        exerciseCount: 0,
        nutritionCount: 0,
        moodAverage: 0,
        hydrationTotal: 0,
      },

      // Actions
      setLoading: (isLoading) => {
        set({ isLoading });
      },

      fetchHealthLogs: async (params) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.getHealthLogs(params);
          set({ 
            logs: response.data || [], 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to fetch health logs:', error);
          notify.error('Failed to load health data');
        }
      },

      logExercise: async (data) => {
        try {
          set({ isLoading: true });
          const newLog = await apiClient.logExercise(data);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isLoading: false 
          });
          
          // Update summary
          get().fetchHealthSummary();
          notify.success('Exercise logged successfully');
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to log exercise:', error);
          notify.error('Failed to log exercise');
          throw error;
        }
      },

      logNutrition: async (data) => {
        try {
          set({ isLoading: true });
          const newLog = await apiClient.logNutrition(data);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isLoading: false 
          });
          
          // Update summary
          get().fetchHealthSummary();
          notify.success('Meal logged successfully');
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to log nutrition:', error);
          notify.error('Failed to log meal');
          throw error;
        }
      },

      logMood: async (data) => {
        try {
          set({ isLoading: true });
          const newLog = await apiClient.logMood(data);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isLoading: false 
          });
          
          // Update summary
          get().fetchHealthSummary();
          notify.success('Mood logged successfully');
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to log mood:', error);
          notify.error('Failed to log mood');
          throw error;
        }
      },

      logHydration: async (data) => {
        try {
          set({ isLoading: true });
          const newLog = await apiClient.logHydration(data);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isLoading: false 
          });
          
          // Update summary
          get().fetchHealthSummary();
          notify.success('Hydration logged successfully');
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to log hydration:', error);
          notify.error('Failed to log hydration');
          throw error;
        }
      },

      fetchHealthSummary: async () => {
        try {
          const summary = await apiClient.getHealthSummary();
          set({ summary });
        } catch (error) {
          console.error('Failed to fetch health summary:', error);
        }
      },

      refreshHealthData: async () => {
        await Promise.all([
          get().fetchHealthLogs(),
          get().fetchHealthSummary(),
        ]);
      },
    }),
    {
      name: 'health-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        logs: state.logs,
        summary: state.summary,
      }),
    }
  )
);