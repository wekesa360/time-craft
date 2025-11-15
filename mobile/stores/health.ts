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
  logSleep: (data: any) => Promise<void>;
  logWeight: (data: any) => Promise<void>;
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
          
          // Ensure intensity is a number (1-10) as expected by backend
          const intensityNumber: number = typeof data?.intensity === 'number'
            ? Math.max(1, Math.min(10, data.intensity)) // Clamp between 1-10
            : 5; // Default to moderate (5)

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

          // Ensure durationMinutes is provided and is a valid number
          const durationMinutes = data?.durationMinutes 
            ? Math.max(1, Math.min(600, Number(data.durationMinutes))) // Clamp between 1-600
            : 30; // Default to 30 minutes if not provided

          const payload: ExercisePayload = {
            type: inferredType,
            activity,
            duration: durationMinutes, // Keep for type compatibility, but we'll send durationMinutes to API
            intensity: intensityNumber as any, // Type assertion needed, but we'll send number to API
            caloriesBurned: data?.caloriesBurned,
            notes: data?.notes,
          };

          // Send properly formatted data to API with real-time timestamp
          const apiPayload = {
            activity: payload.activity,
            durationMinutes: durationMinutes, // Backend expects durationMinutes
            intensity: intensityNumber, // Backend expects number 1-10
            caloriesBurned: payload.caloriesBurned,
            notes: payload.notes,
            type: inferredType, // Include type for reference
            recordedAt: Date.now(), // Set real-time timestamp
          };

          const newLog = await apiClient.logExercise(apiPayload as any);
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
          
          // Convert mobile format to backend format
          // Mobile sends: { mealType, description, calories, protein, carbs, fat }
          // Backend expects: { meal_type, description, calories, protein, carbs, fat, recordedAt }
          const mealType = data?.mealType ?? 'lunch';
          const description = data?.description || 'Meal';
          
          // Format for backend simple nutrition schema
          const apiPayload = {
            meal_type: mealType, // Backend expects meal_type (snake_case)
            description: description,
            calories: data?.calories ? Number(data.calories) : undefined,
            protein: data?.protein ? Number(data.protein) : undefined,
            carbs: data?.carbs ? Number(data.carbs) : undefined,
            fat: data?.fat ? Number(data.fat) : undefined,
            recordedAt: Date.now(), // Set real-time timestamp
          };

          const newLog = await apiClient.logNutrition(apiPayload as any);
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
          const ml: number = data?.amount ?? 250; // Default to 250ml if not provided
          
          // Ensure ml is valid (1-5000)
          const amountMl = Math.max(1, Math.min(5000, ml));
          
          // Map drink type from form data
          const drinkType = data?.drinkType || 'water';
          
          // Build notes from temperature and drink type
          const notes = data?.temperature 
            ? `Temp: ${data.temperature}${data?.drinkType ? `, Type: ${data.drinkType}` : ''}` 
            : undefined;

          // Send properly formatted data to API with real-time timestamp
          const apiPayload = {
            amountMl: amountMl, // Backend expects amountMl (required)
            type: drinkType, // Backend expects type
            notes: notes,
            recordedAt: Date.now(), // Set real-time timestamp
          };

          const newLog = await apiClient.logHydration(apiPayload as any);
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

      logSleep: async (data) => {
        try {
          set({ isMutating: true });
          
          // Get duration in minutes
          const durationMinutes = data?.durationMinutes ?? 420; // Default to 7 hours (420 minutes)
          const durationHours = durationMinutes / 60;
          
          // Quality from form is 1-5, but we'll store it as 1-10 for consistency
          // Map 1-5 scale to 1-10 scale: 1->2, 2->4, 3->6, 4->8, 5->10
          const qualityRaw = data?.quality ?? 3; // Default to 3 (middle)
          const quality = Math.max(1, Math.min(5, Number(qualityRaw))) * 2; // Convert 1-5 to 2-10

          // Send properly formatted sleep data with real-time timestamp
          const apiPayload = {
            type: 'sleep',
            duration_hours: durationHours,
            duration_minutes: durationMinutes,
            quality: quality, // Store quality separately (1-10)
            notes: data?.notes || undefined, // Only include notes if provided
            recordedAt: Date.now(), // Set real-time timestamp
          };

          const newLog = await apiClient.logSleep(apiPayload as any);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isMutating: false 
          });
          
          // Update summary (debounced)
          get().fetchHealthSummaryDebounced();
          notify.success('Sleep logged successfully');
        } catch (error) {
          set({ isMutating: false });
          console.error('Failed to log sleep:', error);
          notify.error('Failed to log sleep');
          throw error;
        }
      },

      logWeight: async (data) => {
        try {
          set({ isMutating: true });
          
          // Convert weight to kg if needed
          const weightKg = data?.unit === 'lb' && data?.weight
            ? Number(data.weight) * 0.453592 // Convert lbs to kg
            : Number(data?.weight) || 0;
          
          // Ensure weight is valid (10-500 kg)
          const validWeight = Math.max(10, Math.min(500, weightKg));

          // Send properly formatted weight data with real-time timestamp
          const apiPayload = {
            type: 'weight',
            value: validWeight, // Backend expects value in kg
            unit: 'kg',
            notes: data?.notes || undefined,
            category: 'weight',
            recordedAt: Date.now(), // Set real-time timestamp
          };

          const newLog = await apiClient.logWeight(apiPayload as any);
          const currentLogs = get().logs;
          set({ 
            logs: [newLog, ...currentLogs],
            isMutating: false 
          });
          
          // Update summary (debounced)
          get().fetchHealthSummaryDebounced();
          notify.success('Weight logged successfully');
        } catch (error) {
          set({ isMutating: false });
          console.error('Failed to log weight:', error);
          notify.error('Failed to log weight');
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