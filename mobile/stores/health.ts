// Health tracking store with Zustand for React Native
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, notify } from '../lib/api';
import type { 
  HealthLog, 
  ExercisePayload, 
  NutritionPayload, 
  MoodPayload, 
  HydrationPayload 
} from '../types';

// Debounce timer for summary refresh
let summaryDebounceTimer: any = null;

interface HealthStore {
  // State
  logs: HealthLog[];
  isFetching: boolean;
  isMutating: boolean;
  summary: {
    exerciseCount: number;
    nutritionCount: number;
    moodAverage: number;
    hydrationTotal: number;
  };
  preferredWeightUnit: 'kg' | 'lb';
  // Actions
  fetchHealthLogs: (params?: { type?: string; startDate?: number; endDate?: number }) => Promise<void>;
  logExercise: (data: any) => Promise<void>;
  logNutrition: (data: any) => Promise<void>;
  logMood: (data: any) => Promise<void>;
  logHydration: (data: any) => Promise<void>;
  fetchHealthSummary: () => Promise<void>;
  fetchHealthSummaryDebounced: () => void;
  setLoading: (loading: boolean) => void;
  refreshHealthData: () => Promise<void>;
  setPreferredWeightUnit: (unit: 'kg' | 'lb') => void;
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      logs: [],
      isFetching: false,
      isMutating: false,
      summary: {
        exerciseCount: 0,
        nutritionCount: 0,
        moodAverage: 0,
        hydrationTotal: 0,
      },
      preferredWeightUnit: 'kg',

      // Actions
      setLoading: (isLoading) => {
        // Backward-compat: map legacy setter to mutation flag
        set({ isMutating: isLoading });
      },

      setPreferredWeightUnit: (unit) => set({ preferredWeightUnit: unit }),

      fetchHealthLogs: async (params) => {
        try {
          set({ isFetching: true });
          const response = await apiClient.getHealthLogs(params);
          set({ 
            logs: response || [], 
            isFetching: false 
          });
        } catch (error) {
          set({ isFetching: false });
          console.error('Failed to fetch health logs:', error);
          notify.error('Failed to load health data');
        }
      },

      logExercise: async (data) => {
        try {
          set({ isMutating: true });
          const normIntensity: 'low' | 'moderate' | 'high' =
            typeof data?.intensity === 'number'
              ? (data.intensity <= 3 ? 'low' : data.intensity <= 7 ? 'moderate' : 'high')
              : 'moderate';

          const activity: string = data?.activity || '';
          const lower = activity.toLowerCase();
          const inferredType: 'cardio' | 'strength' | 'flexibility' | 'sports' =
            lower.includes('run') || lower.includes('walk') || lower.includes('cycle') || lower.includes('swim')
              ? 'cardio'
              : lower.includes('yoga') || lower.includes('stretch')
              ? 'flexibility'
              : lower.includes('lift') || lower.includes('strength') || lower.includes('weight')
              ? 'strength'
              : lower.includes('tennis') || lower.includes('basketball') || lower.includes('football')
              ? 'sports'
              : 'cardio';

          const payload: ExercisePayload = {
            type: inferredType,
            activity,
            duration: data?.durationMinutes ?? 0,
            intensity: normIntensity,
            caloriesBurned: data?.caloriesBurned,
            notes: data?.notes,
          };

          const newLog = await apiClient.logExercise(payload as any);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isMutating: false 
          });
          
          // Update summary (debounced)
          get().fetchHealthSummaryDebounced();
          notify.success('Exercise logged successfully');
        } catch (error) {
          set({ isMutating: false });
          console.error('Failed to log exercise:', error);
          notify.error('Failed to log exercise');
          throw error;
        }
      },

      logNutrition: async (data) => {
        try {
          set({ isMutating: true });
          const payload: NutritionPayload = {
            meal: data?.mealType ?? 'lunch',
            calories: data?.calories,
            protein: data?.protein,
            carbs: data?.carbs,
            fat: data?.fat,
            notes: data?.description,
          };
          const newLog = await apiClient.logNutrition(payload as any);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isMutating: false 
          });
          
          // Update summary (debounced)
          get().fetchHealthSummaryDebounced();
          notify.success('Meal logged successfully');
        } catch (error) {
          set({ isMutating: false });
          console.error('Failed to log nutrition:', error);
          notify.error('Failed to log meal');
          throw error;
        }
      },

      logMood: async (data) => {
        try {
          set({ isMutating: true });
          const payload: MoodPayload = {
            score: data?.score ?? 5,
            energy: data?.energy ?? 5,
            stress: data?.stress ?? 5,
            notes: data?.notes,
          };
          const newLog = await apiClient.logMood(payload as any);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isMutating: false 
          });
          
          // Update summary (debounced)
          get().fetchHealthSummaryDebounced();
          notify.success('Mood logged successfully');
        } catch (error) {
          set({ isMutating: false });
          console.error('Failed to log mood:', error);
          notify.error('Failed to log mood');
          throw error;
        }
      },

      logHydration: async (data) => {
        try {
          set({ isMutating: true });
          const ml: number = data?.amount ?? 0;
          const payload: HydrationPayload = {
            glasses: Math.max(1, Math.round((ml || 0) / 250)),
            totalMl: ml,
            notes: data?.temperature ? `Temp: ${data.temperature}${data?.drinkType ? `, Type: ${data.drinkType}` : ''}` : undefined,
          };
          const newLog = await apiClient.logHydration(payload as any);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isMutating: false 
          });
          
          // Update summary (debounced)
          get().fetchHealthSummaryDebounced();
          notify.success('Hydration logged successfully');
        } catch (error) {
          set({ isMutating: false });
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

      fetchHealthSummaryDebounced: () => {
        if (summaryDebounceTimer) {
          clearTimeout(summaryDebounceTimer);
        }
        summaryDebounceTimer = setTimeout(() => {
          get().fetchHealthSummary();
        }, 350);
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
        preferredWeightUnit: state.preferredWeightUnit,
      }),
    }
  )
);