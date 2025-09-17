// Health tracking store with Zustand
import { create } from 'zustand';
import { apiClient } from '../lib/api';
import type { 
  HealthLog, 
  ExerciseData, 
  NutritionData, 
  MoodData, 
  HydrationData,
  HealthState,
  HealthInsights,
  HealthGoal
} from '../types';

interface HealthStore extends HealthState {
  // Actions
  fetchLogs: (params?: {
    type?: string;
    startDate?: number;
    endDate?: number;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  
  // Logging actions
  logExercise: (data: ExerciseData) => Promise<HealthLog>;
  logNutrition: (data: NutritionData) => Promise<HealthLog>;
  logMood: (data: MoodData) => Promise<HealthLog>;
  logHydration: (data: HydrationData) => Promise<HealthLog>;
  
  // State management
  setLoading: (loading: boolean) => void;
  
  // Summary and analytics
  fetchSummary: (days?: number) => Promise<void>;
  
  // AI Insights
  insights: HealthInsights | null;
  fetchInsights: (days?: number) => Promise<void>;
  
  // Health Goals
  goals: HealthGoal[];
  fetchGoals: () => Promise<void>;
  createGoal: (goal: Omit<HealthGoal, 'id' | 'userId' | 'progress' | 'isActive'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<HealthGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Filtering and search
  filterLogs: (type?: string) => HealthLog[];
  getLogsByDateRange: (startDate: number, endDate: number) => HealthLog[];
  
  // Quick stats
  getTodaysLogs: () => HealthLog[];
  getWeeklyStats: () => {
    exerciseMinutes: number;
    avgMood: number;
    hydrationAmount: number;
    nutritionEntries: number;
  };
}

export const useHealthStore = create<HealthStore>((set, get) => ({
  // Initial state
  logs: [],
  isLoading: false,
  summary: {
    exerciseCount: 0,
    nutritionCount: 0,
    moodAverage: 0,
    hydrationTotal: 0,
  },
  insights: null,
  goals: [],

  // Actions
  fetchLogs: async (params = {}) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.getHealthLogs(params);
      set({
        logs: response.data || [],
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logExercise: async (data) => {
    try {
      const log = await apiClient.logExercise(data);
      set((state) => ({
        logs: [log, ...state.logs],
      }));
      
      // Update summary
      get().fetchSummary();
      return log;
    } catch (error) {
      throw error;
    }
  },

  logNutrition: async (data) => {
    try {
      const log = await apiClient.logNutrition(data);
      set((state) => ({
        logs: [log, ...state.logs],
      }));
      
      // Update summary
      get().fetchSummary();
      return log;
    } catch (error) {
      throw error;
    }
  },

  logMood: async (data) => {
    try {
      const log = await apiClient.logMood(data);
      set((state) => ({
        logs: [log, ...state.logs],
      }));
      
      // Update summary
      get().fetchSummary();
      return log;
    } catch (error) {
      throw error;
    }
  },

  logHydration: async (data) => {
    try {
      const log = await apiClient.logHydration(data);
      set((state) => ({
        logs: [log, ...state.logs],
      }));
      
      // Update summary
      get().fetchSummary();
      return log;
    } catch (error) {
      throw error;
    }
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  fetchSummary: async (days) => {
    try {
      const summary = await apiClient.getHealthSummary(days);
      set({ summary });
    } catch (error) {
      console.error('Failed to fetch health summary:', error);
    }
  },

  // AI Insights
  fetchInsights: async (days) => {
    try {
      set({ isLoading: true });
      const insights = await apiClient.getHealthInsights(days);
      set({ insights, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch health insights:', error);
    }
  },

  // Health Goals
  fetchGoals: async () => {
    try {
      set({ isLoading: true });
      const goals = await apiClient.getHealthGoals();
      set({ goals, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch health goals:', error);
    }
  },

  createGoal: async (goalData) => {
    try {
      set({ isLoading: true });
      const goal = await apiClient.createHealthGoal(goalData);
      const { goals } = get();
      set({
        goals: [...goals, goal],
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateGoal: async (id, goalData) => {
    try {
      set({ isLoading: true });
      const goal = await apiClient.updateHealthGoal(id, goalData);
      const { goals } = get();
      set({
        goals: goals.map(g => g.id === id ? goal : g),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteGoal: async (id) => {
    try {
      set({ isLoading: true });
      await apiClient.deleteHealthGoal(id);
      const { goals } = get();
      set({
        goals: goals.filter(g => g.id !== id),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Filtering and search
  filterLogs: (type) => {
    const { logs } = get();
    if (!type) return logs;
    return logs.filter((log) => log.type === type);
  },

  getLogsByDateRange: (startDate, endDate) => {
    const { logs } = get();
    return logs.filter(
      (log) => log.recordedAt >= startDate && log.recordedAt <= endDate
    );
  },

  // Quick stats
  getTodaysLogs: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;
    
    return get().getLogsByDateRange(todayStart, todayEnd);
  },

  getWeeklyStats: () => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyLogs = get().getLogsByDateRange(weekAgo, Date.now());
    
    const exerciseLogs = weeklyLogs.filter((log) => log.type === 'exercise');
    const moodLogs = weeklyLogs.filter((log) => log.type === 'mood');
    const hydrationLogs = weeklyLogs.filter((log) => log.type === 'hydration');
    const nutritionLogs = weeklyLogs.filter((log) => log.type === 'nutrition');
    
    // Calculate exercise minutes
    const exerciseMinutes = exerciseLogs.reduce((total, log) => {
      const payload = log.payload as ExerciseData;
      return total + (payload.durationMinutes || 0);
    }, 0);
    
    // Calculate average mood
    const totalMoodScore = moodLogs.reduce((total, log) => {
      const payload = log.payload as MoodData;
      return total + (payload.score || 0);
    }, 0);
    const avgMood = moodLogs.length > 0 ? totalMoodScore / moodLogs.length : 0;
    
    // Calculate total hydration
    const hydrationAmount = hydrationLogs.reduce((total, log) => {
      const payload = log.payload as HydrationData;
      return total + (payload.amount || 0);
    }, 0);
    
    return {
      exerciseMinutes,
      avgMood: Math.round(avgMood * 10) / 10,
      hydrationAmount,
      nutritionEntries: nutritionLogs.length,
    };
  },
}));