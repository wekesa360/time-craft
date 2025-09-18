import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';

export const useAnalyticsQueries = {
  // Dashboard overview data
  useDashboardData: (timeRange: string, category: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.dashboard(), timeRange, category],
      queryFn: () => apiClient.getAnalyticsDashboard(timeRange, category),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });
  },

  // Task analytics
  useTaskAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'tasks', timeRange],
      queryFn: () => apiClient.getTaskAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Health analytics
  useHealthAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'health', timeRange],
      queryFn: () => apiClient.getHealthAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Focus analytics
  useFocusAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'focus', timeRange],
      queryFn: () => apiClient.getFocusAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Social analytics
  useSocialAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'social', timeRange],
      queryFn: () => apiClient.getSocialAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Productivity reports
  useProductivityReport: (timeRange: string, reportType: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.reports(), reportType, timeRange],
      queryFn: () => apiClient.getProductivityReport(timeRange, reportType),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },

  // User behavior analytics
  useUserBehaviorAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'behavior', timeRange],
      queryFn: () => apiClient.getUserBehaviorAnalytics(timeRange),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  },

  // Performance metrics
  usePerformanceMetrics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'performance', timeRange],
      queryFn: () => apiClient.getPerformanceMetrics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Goal tracking analytics
  useGoalAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'goals', timeRange],
      queryFn: () => apiClient.getGoalAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Time tracking analytics
  useTimeTrackingAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'time', timeRange],
      queryFn: () => apiClient.getTimeTrackingAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Habit analytics
  useHabitAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'habits', timeRange],
      queryFn: () => apiClient.getHabitAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Mood analytics
  useMoodAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'mood', timeRange],
      queryFn: () => apiClient.getMoodAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Energy level analytics
  useEnergyAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'energy', timeRange],
      queryFn: () => apiClient.getEnergyAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Stress level analytics
  useStressAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'stress', timeRange],
      queryFn: () => apiClient.getStressAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Sleep analytics
  useSleepAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'sleep', timeRange],
      queryFn: () => apiClient.getSleepAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Exercise analytics
  useExerciseAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'exercise', timeRange],
      queryFn: () => apiClient.getExerciseAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Nutrition analytics
  useNutritionAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'nutrition', timeRange],
      queryFn: () => apiClient.getNutritionAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Hydration analytics
  useHydrationAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'hydration', timeRange],
      queryFn: () => apiClient.getHydrationAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Badge analytics
  useBadgeAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'badges', timeRange],
      queryFn: () => apiClient.getBadgeAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Challenge analytics
  useChallengeAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'challenges', timeRange],
      queryFn: () => apiClient.getChallengeAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Voice analytics
  useVoiceAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'voice', timeRange],
      queryFn: () => apiClient.getVoiceAnalytics(),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Calendar analytics
  useCalendarAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'calendar', timeRange],
      queryFn: () => apiClient.getCalendarAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Notification analytics
  useNotificationAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'notifications', timeRange],
      queryFn: () => apiClient.getNotificationAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // System analytics (admin only)
  useSystemAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'system', timeRange],
      queryFn: () => apiClient.getSystemAnalytics(timeRange),
      staleTime: 2 * 60 * 1000, // 2 minutes for system data
    });
  },

  // User engagement analytics
  useEngagementAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'engagement', timeRange],
      queryFn: () => apiClient.getEngagementAnalytics(timeRange),
      staleTime: 10 * 60 * 1000,
    });
  },

  // Retention analytics
  useRetentionAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'retention', timeRange],
      queryFn: () => apiClient.getRetentionAnalytics(timeRange),
      staleTime: 15 * 60 * 1000,
    });
  },

  // Feature usage analytics
  useFeatureUsageAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'features', timeRange],
      queryFn: () => apiClient.getFeatureUsageAnalytics(timeRange),
      staleTime: 10 * 60 * 1000,
    });
  },

  // Error analytics
  useErrorAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'errors', timeRange],
      queryFn: () => apiClient.getErrorAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Performance analytics
  usePerformanceAnalytics: (timeRange: string) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'performance', timeRange],
      queryFn: () => apiClient.getPerformanceAnalytics(timeRange),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Custom analytics query
  useCustomAnalytics: (endpoint: string, params: Record<string, any>) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'custom', endpoint, params],
      queryFn: () => apiClient.getCustomAnalytics(endpoint, params),
      staleTime: 5 * 60 * 1000,
    });
  }
};
