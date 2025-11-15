// React Query hooks for health tracking
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { 
  HealthLog, 
  ExerciseData, 
  NutritionData, 
  MoodData, 
  HydrationData,
  SleepData,
  WeightData,
  HealthInsights,
  HealthGoal
} from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const healthKeys = {
  all: ['health'] as const,
  logs: () => [...healthKeys.all, 'logs'] as const,
  logsList: (filters: Record<string, any>) => [...healthKeys.logs(), { filters }] as const,
  summary: (days?: number) => [...healthKeys.all, 'summary', { days }] as const,
  insights: (days?: number) => [...healthKeys.all, 'insights', { days }] as const,
  goals: () => [...healthKeys.all, 'goals'] as const,
  goal: (id: string) => [...healthKeys.goals(), id] as const,
};

// Health logs query
export const useHealthLogsQuery = (params?: {
  type?: string;
  startDate?: number;
  endDate?: number;
  page?: number;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: healthKeys.logsList(params || {}),
    queryFn: async () => {
      const response = await apiClient.getHealthLogs(params);
      // Backend returns { logs: [...], hasMore, nextCursor, total }
      // Return full response for pagination support
      return {
        logs: response.logs || response.data || [],
        hasMore: response.hasMore || false,
        nextCursor: response.nextCursor || null,
        total: response.total || (response.logs?.length || response.data?.length || 0)
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Health summary query
export const useHealthSummaryQuery = (days?: number) => {
  return useQuery({
    queryKey: healthKeys.summary(days),
    queryFn: () => apiClient.getHealthSummary(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Health insights query
export const useHealthInsightsQuery = (days?: number) => {
  return useQuery({
    queryKey: healthKeys.insights(days),
    queryFn: () => apiClient.getHealthInsights(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Health goals query
export const useHealthGoalsQuery = () => {
  return useQuery({
    queryKey: healthKeys.goals(),
    queryFn: () => apiClient.getHealthGoals(),
    staleTime: 5 * 60 * 1000,
  });
};

// Log exercise mutation
export const useLogExerciseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExerciseData) => {
      console.log('📝 useLogExerciseMutation called with data:', data);
      return apiClient.logExercise(data);
    },
    onMutate: async (newExercise) => {
      console.log('🔄 Optimistically updating exercise log');
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: healthKeys.logs() });

      // Snapshot previous value
      const previousLogs = queryClient.getQueryData(healthKeys.logs());

      // Optimistically update
      const optimisticLog: HealthLog = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        type: 'exercise',
        payload: newExercise,
        recordedAt: Date.now(),
        source: 'manual',
        createdAt: Date.now(),
      };

      queryClient.setQueriesData(
        { queryKey: healthKeys.logs() },
        (old: any) => {
          // Handle both paginated format and array format
          if (old?.logs && Array.isArray(old.logs)) {
            return {
              ...old,
              logs: [optimisticLog, ...old.logs],
              total: (old.total || old.logs.length) + 1
            };
          }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [optimisticLog, ...old.data],
            };
          }
          if (Array.isArray(old)) {
            return [optimisticLog, ...old];
          }
          return { logs: [optimisticLog], hasMore: false, total: 1 };
        }
      );

      return { previousLogs, optimisticLog };
    },
    onError: (err, newExercise, context) => {
      console.error('❌ Exercise log mutation error:', err);
      if (context?.previousLogs) {
        queryClient.setQueriesData({ queryKey: healthKeys.logs() }, context.previousLogs);
      }
      toast.error('Failed to log exercise. Please try again.');
    },
    onSuccess: (data, variables, context) => {
      console.log('✅ Exercise logged successfully, data:', data);
      // Replace optimistic log with real data
      if (context?.optimisticLog) {
        queryClient.setQueriesData(
          { queryKey: healthKeys.logs() },
          (old: any) => {
            // Handle both paginated format and array format
            if (old?.logs && Array.isArray(old.logs)) {
              return {
                ...old,
                logs: [data, ...old.logs.filter((log: HealthLog) => log.id !== context.optimisticLog.id)],
                total: old.total || old.logs.length
              };
            }
            if (old?.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: [data, ...old.data.filter((log: HealthLog) => log.id !== context.optimisticLog.id)]
              };
            }
            if (Array.isArray(old)) {
              return [data, ...old.filter((log: HealthLog) => log.id !== context.optimisticLog.id)];
            }
            return { logs: [data], hasMore: false, total: 1 };
          }
        );
      }
      toast.success('💪 Exercise logged successfully!');
    },
    onSettled: () => {
      console.log('🔄 Exercise log settled, invalidating queries');
      queryClient.invalidateQueries({ queryKey: healthKeys.logs() });
      queryClient.invalidateQueries({ queryKey: healthKeys.summary() });
      queryClient.invalidateQueries({ queryKey: healthKeys.insights() });
    },
  });
};

// Log nutrition mutation
export const useLogNutritionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NutritionData) => apiClient.logNutrition(data),
    onMutate: async (newNutrition) => {
      await queryClient.cancelQueries({ queryKey: healthKeys.logs() });

      const previousLogs = queryClient.getQueryData(healthKeys.logs());

      const optimisticLog: HealthLog = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        type: 'nutrition',
        payload: newNutrition,
        recordedAt: Date.now(),
        source: 'manual',
        createdAt: Date.now(),
      };

      queryClient.setQueriesData(
        { queryKey: healthKeys.logs() },
        (old: any) => {
          // Handle both paginated format and array format
          if (old?.logs && Array.isArray(old.logs)) {
            return {
              ...old,
              logs: [optimisticLog, ...old.logs],
              total: (old.total || old.logs.length) + 1
            };
          }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [optimisticLog, ...old.data],
            };
          }
          if (Array.isArray(old)) {
            return [optimisticLog, ...old];
          }
          return { logs: [optimisticLog], hasMore: false, total: 1 };
        }
      );

      return { previousLogs, optimisticLog };
    },
    onError: (err, newNutrition, context) => {
      if (context?.previousLogs) {
        queryClient.setQueriesData({ queryKey: healthKeys.logs() }, context.previousLogs);
      }
      toast.error('Failed to log nutrition');
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic log with real data
      if (context?.optimisticLog) {
        queryClient.setQueriesData(
          { queryKey: healthKeys.logs() },
          (old: any) => {
            // Handle both paginated format and array format
            if (old?.logs && Array.isArray(old.logs)) {
              return {
                ...old,
                logs: [data, ...old.logs.filter((log: HealthLog) => log.id !== context.optimisticLog.id)],
                total: old.total || old.logs.length
              };
            }
            if (old?.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: [data, ...old.data.filter((log: HealthLog) => log.id !== context.optimisticLog.id)]
              };
            }
            if (Array.isArray(old)) {
              return [data, ...old.filter((log: HealthLog) => log.id !== context.optimisticLog.id)];
            }
            return { logs: [data], hasMore: false, total: 1 };
          }
        );
      }
      toast.success('🍎 Nutrition logged successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: healthKeys.logs() });
      queryClient.invalidateQueries({ queryKey: healthKeys.summary() });
      queryClient.invalidateQueries({ queryKey: healthKeys.insights() });
    },
  });
};

// Log mood mutation
export const useLogMoodMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MoodData) => apiClient.logMood(data),
    onMutate: async (newMood) => {
      await queryClient.cancelQueries({ queryKey: healthKeys.logs() });

      const previousLogs = queryClient.getQueryData(healthKeys.logs());

      const optimisticLog: HealthLog = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        type: 'mood',
        payload: newMood,
        recordedAt: Date.now(),
        source: 'manual',
        createdAt: Date.now(),
      };

      queryClient.setQueriesData(
        { queryKey: healthKeys.logs() },
        (old: any) => {
          // Handle both paginated format and array format
          if (old?.logs && Array.isArray(old.logs)) {
            return {
              ...old,
              logs: [optimisticLog, ...old.logs],
              total: (old.total || old.logs.length) + 1
            };
          }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [optimisticLog, ...old.data],
            };
          }
          if (Array.isArray(old)) {
            return [optimisticLog, ...old];
          }
          return { logs: [optimisticLog], hasMore: false, total: 1 };
        }
      );

      return { previousLogs, optimisticLog };
    },
    onError: (err, newMood, context) => {
      if (context?.previousLogs) {
        queryClient.setQueriesData({ queryKey: healthKeys.logs() }, context.previousLogs);
      }
      toast.error('Failed to log mood');
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic log with real data
      if (context?.optimisticLog) {
        queryClient.setQueriesData(
          { queryKey: healthKeys.logs() },
          (old: any) => {
            // Handle both paginated format and array format
            if (old?.logs && Array.isArray(old.logs)) {
              return {
                ...old,
                logs: [data, ...old.logs.filter((log: HealthLog) => log.id !== context.optimisticLog.id)],
                total: old.total || old.logs.length
              };
            }
            if (old?.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: [data, ...old.data.filter((log: HealthLog) => log.id !== context.optimisticLog.id)]
              };
            }
            if (Array.isArray(old)) {
              return [data, ...old.filter((log: HealthLog) => log.id !== context.optimisticLog.id)];
            }
            return { logs: [data], hasMore: false, total: 1 };
          }
        );
      }
      toast.success('😊 Mood logged successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: healthKeys.logs() });
      queryClient.invalidateQueries({ queryKey: healthKeys.summary() });
      queryClient.invalidateQueries({ queryKey: healthKeys.insights() });
    },
  });
};

// Log hydration mutation
export const useLogHydrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HydrationData) => apiClient.logHydration(data),
    onMutate: async (newHydration) => {
      await queryClient.cancelQueries({ queryKey: healthKeys.logs() });

      const previousLogs = queryClient.getQueryData(healthKeys.logs());

      const optimisticLog: HealthLog = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        type: 'hydration',
        payload: newHydration,
        recordedAt: Date.now(),
        source: 'manual',
        createdAt: Date.now(),
      };

      queryClient.setQueriesData(
        { queryKey: healthKeys.logs() },
        (old: any) => {
          // Handle both paginated format and array format
          if (old?.logs && Array.isArray(old.logs)) {
            return {
              ...old,
              logs: [optimisticLog, ...old.logs],
              total: (old.total || old.logs.length) + 1
            };
          }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [optimisticLog, ...old.data],
            };
          }
          if (Array.isArray(old)) {
            return [optimisticLog, ...old];
          }
          return { logs: [optimisticLog], hasMore: false, total: 1 };
        }
      );

      return { previousLogs, optimisticLog };
    },
    onError: (err, newHydration, context) => {
      if (context?.previousLogs) {
        queryClient.setQueriesData({ queryKey: healthKeys.logs() }, context.previousLogs);
      }
      toast.error('Failed to log hydration');
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic log with real data
      if (context?.optimisticLog) {
        queryClient.setQueriesData(
          { queryKey: healthKeys.logs() },
          (old: any) => {
            // Handle both paginated format and array format
            if (old?.logs && Array.isArray(old.logs)) {
              return {
                ...old,
                logs: [data, ...old.logs.filter((log: HealthLog) => log.id !== context.optimisticLog.id)],
                total: old.total || old.logs.length
              };
            }
            if (old?.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: [data, ...old.data.filter((log: HealthLog) => log.id !== context.optimisticLog.id)]
              };
            }
            if (Array.isArray(old)) {
              return [data, ...old.filter((log: HealthLog) => log.id !== context.optimisticLog.id)];
            }
            return { logs: [data], hasMore: false, total: 1 };
          }
        );
      }
      toast.success('💧 Hydration logged successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: healthKeys.logs() });
      queryClient.invalidateQueries({ queryKey: healthKeys.summary() });
      queryClient.invalidateQueries({ queryKey: healthKeys.insights() });
    },
  });
};

// Create health goal mutation
export const useCreateHealthGoalMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<HealthGoal, 'id' | 'userId' | 'progress' | 'isActive'>) =>
      apiClient.createHealthGoal(data),
    onSuccess: () => {
      toast.success('🎯 Health goal created!');
      queryClient.invalidateQueries({ queryKey: healthKeys.goals() });
    },
    onError: () => {
      toast.error('Failed to create health goal');
    },
  });
};

// Update health goal mutation
export const useUpdateHealthGoalMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HealthGoal> }) =>
      apiClient.updateHealthGoal(id, data),
    onSuccess: () => {
      toast.success('Health goal updated!');
      queryClient.invalidateQueries({ queryKey: healthKeys.goals() });
    },
    onError: () => {
      toast.error('Failed to update health goal');
    },
  });
};

// Delete health goal mutation
export const useDeleteHealthGoalMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteHealthGoal(id),
    onSuccess: () => {
      toast.success('Health goal deleted');
      queryClient.invalidateQueries({ queryKey: healthKeys.goals() });
    },
    onError: () => {
      toast.error('Failed to delete health goal');
    },
  });
};

// Log sleep mutation
export const useLogSleepMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SleepData) => apiClient.logSleep(data),
    onMutate: async (newSleep) => {
      await queryClient.cancelQueries({ queryKey: healthKeys.logs() });

      const previousLogs = queryClient.getQueryData(healthKeys.logs());

      const optimisticLog: HealthLog = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        type: 'sleep',
        payload: newSleep,
        recordedAt: Date.now(),
        source: 'manual',
        createdAt: Date.now(),
      };

      queryClient.setQueriesData(
        { queryKey: healthKeys.logs() },
        (old: any) => {
          if (old?.logs && Array.isArray(old.logs)) {
            return {
              ...old,
              logs: [optimisticLog, ...old.logs],
              total: (old.total || old.logs.length) + 1
            };
          }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [optimisticLog, ...old.data],
            };
          }
          if (Array.isArray(old)) {
            return [optimisticLog, ...old];
          }
          return { logs: [optimisticLog], hasMore: false, total: 1 };
        }
      );

      return { previousLogs, optimisticLog };
    },
    onError: (err, newSleep, context) => {
      if (context?.previousLogs) {
        queryClient.setQueriesData({ queryKey: healthKeys.logs() }, context.previousLogs);
      }
      toast.error('Failed to log sleep');
    },
    onSuccess: (data, variables, context) => {
      if (context?.optimisticLog) {
        queryClient.setQueriesData(
          { queryKey: healthKeys.logs() },
          (old: any) => {
            if (old?.logs && Array.isArray(old.logs)) {
              return {
                ...old,
                logs: [data, ...old.logs.filter((log: HealthLog) => log.id !== context.optimisticLog.id)],
                total: old.total || old.logs.length
              };
            }
            if (old?.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: [data, ...old.data.filter((log: HealthLog) => log.id !== context.optimisticLog.id)]
              };
            }
            if (Array.isArray(old)) {
              return [data, ...old.filter((log: HealthLog) => log.id !== context.optimisticLog.id)];
            }
            return { logs: [data], hasMore: false, total: 1 };
          }
        );
      }
      toast.success('😴 Sleep logged successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: healthKeys.logs() });
      queryClient.invalidateQueries({ queryKey: healthKeys.summary() });
      queryClient.invalidateQueries({ queryKey: healthKeys.insights() });
    },
  });
};

// Log weight mutation
export const useLogWeightMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WeightData) => apiClient.logWeight(data),
    onMutate: async (newWeight) => {
      await queryClient.cancelQueries({ queryKey: healthKeys.logs() });

      const previousLogs = queryClient.getQueryData(healthKeys.logs());

      const optimisticLog: HealthLog = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        type: 'weight',
        payload: newWeight,
        recordedAt: Date.now(),
        source: 'manual',
        createdAt: Date.now(),
      };

      queryClient.setQueriesData(
        { queryKey: healthKeys.logs() },
        (old: any) => {
          if (old?.logs && Array.isArray(old.logs)) {
            return {
              ...old,
              logs: [optimisticLog, ...old.logs],
              total: (old.total || old.logs.length) + 1
            };
          }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [optimisticLog, ...old.data],
            };
          }
          if (Array.isArray(old)) {
            return [optimisticLog, ...old];
          }
          return { logs: [optimisticLog], hasMore: false, total: 1 };
        }
      );

      return { previousLogs, optimisticLog };
    },
    onError: (err, newWeight, context) => {
      if (context?.previousLogs) {
        queryClient.setQueriesData({ queryKey: healthKeys.logs() }, context.previousLogs);
      }
      toast.error('Failed to log weight');
    },
    onSuccess: (data, variables, context) => {
      if (context?.optimisticLog) {
        queryClient.setQueriesData(
          { queryKey: healthKeys.logs() },
          (old: any) => {
            if (old?.logs && Array.isArray(old.logs)) {
              return {
                ...old,
                logs: [data, ...old.logs.filter((log: HealthLog) => log.id !== context.optimisticLog.id)],
                total: old.total || old.logs.length
              };
            }
            if (old?.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: [data, ...old.data.filter((log: HealthLog) => log.id !== context.optimisticLog.id)]
              };
            }
            if (Array.isArray(old)) {
              return [data, ...old.filter((log: HealthLog) => log.id !== context.optimisticLog.id)];
            }
            return { logs: [data], hasMore: false, total: 1 };
          }
        );
      }
      toast.success('⚖️ Weight logged successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: healthKeys.logs() });
      queryClient.invalidateQueries({ queryKey: healthKeys.summary() });
      queryClient.invalidateQueries({ queryKey: healthKeys.insights() });
    },
  });
};

// Export all hooks as a single object for easier importing
export const useHealthQueries = () => {
  return {
    useHealthLogsQuery,
    useHealthSummaryQuery,
    useHealthInsightsQuery,
    useHealthGoalsQuery,
    useLogExerciseMutation,
    useLogNutritionMutation,
    useLogMoodMutation,
    useLogHydrationMutation,
    useLogSleepMutation,
    useLogWeightMutation,
    useCreateHealthGoalMutation,
    useUpdateHealthGoalMutation,
    useDeleteHealthGoalMutation,
  };
};