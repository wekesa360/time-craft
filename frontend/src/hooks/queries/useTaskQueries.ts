// React Query hooks for task management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useTaskStore } from '../../stores/tasks';
import type { Task, TaskForm, EisenhowerMatrix, MatrixStats } from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
  matrix: () => [...taskKeys.all, 'matrix'] as const,
  matrixStats: () => [...taskKeys.all, 'matrix', 'stats'] as const,
};

// Tasks list query
export const useTasksQuery = (params?: {
  status?: string;
  priority?: number;
  contextType?: string;
  search?: string;
  startDate?: number;
  endDate?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: taskKeys.list(params || {}),
    queryFn: async () => {
      const response = await apiClient.getTasks(params);
      return response.data || []; // Extract the tasks array from the paginated response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Single task query
export const useTaskQuery = (id: string) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => apiClient.getTask(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Task stats query
export const useTaskStatsQuery = () => {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: () => apiClient.getTaskStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Eisenhower Matrix query
export const useEisenhowerMatrixQuery = () => {
  return useQuery({
    queryKey: taskKeys.matrix(),
    queryFn: () => apiClient.getEisenhowerMatrix(),
    staleTime: 5 * 60 * 1000,
  });
};

// Matrix stats query
export const useMatrixStatsQuery = () => {
  return useQuery({
    queryKey: taskKeys.matrixStats(),
    queryFn: () => apiClient.getMatrixStats(),
    staleTime: 5 * 60 * 1000,
  });
};

// Create task mutation
export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskForm) => apiClient.createTask(data),
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(taskKeys.lists());

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;
          const optimisticTask: Task = {
            id: `temp-${Date.now()}`,
            userId: 'current-user',
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            urgency: 3,
            importance: 3,
            quadrant: 'do',
            status: newTask.status || 'pending',
            dueDate: newTask.dueDate ? new Date(newTask.dueDate).getTime() : undefined,
            estimatedDuration: newTask.estimatedDuration,
            contextType: newTask.contextType as any,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          return {
            ...old,
            data: [optimisticTask, ...old.data],
          };
        }
      );

      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: taskKeys.lists() }, context.previousTasks);
      }
      toast.error('Failed to create task');
    },
    onSuccess: (data) => {
      toast.success('Task created successfully');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskKeys.matrix() });
    },
  });
};

// Update task mutation
export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskForm> }) =>
      apiClient.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous values
      const previousTask = queryClient.getQueryData(taskKeys.detail(id));
      const previousTasks = queryClient.getQueryData(taskKeys.lists());

      // Optimistically update single task
      queryClient.setQueryData(taskKeys.detail(id), (old: Task) => ({
        ...old,
        ...data,
        updatedAt: Date.now(),
      }));

      // Optimistically update task lists
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((task: Task) =>
              task.id === id ? { ...task, ...data, updatedAt: Date.now() } : task
            ),
          };
        }
      );

      return { previousTask, previousTasks };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
      }
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: taskKeys.lists() }, context.previousTasks);
      }
      toast.error('Failed to update task');
    },
    onSuccess: () => {
      toast.success('Task updated successfully');
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskKeys.matrix() });
    },
  });
};

// Delete task mutation
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteTask(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(taskKeys.lists());

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((task: Task) => task.id !== id),
          };
        }
      );

      return { previousTasks };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: taskKeys.lists() }, context.previousTasks);
      }
      toast.error('Failed to delete task');
    },
    onSuccess: () => {
      toast.success('Task deleted successfully');
    },
    onSettled: (data, error, id) => {
      // Remove from cache and refetch
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskKeys.matrix() });
    },
  });
};

// Complete task mutation
export const useCompleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.completeTask(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(taskKeys.lists());

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((task: Task) =>
              task.id === id
                ? { ...task, status: 'completed' as const, completedAt: Date.now() }
                : task
            ),
          };
        }
      );

      return { previousTasks };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: taskKeys.lists() }, context.previousTasks);
      }
      toast.error('Failed to complete task');
    },
    onSuccess: () => {
      toast.success('🎉 Task completed!');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskKeys.matrix() });
    },
  });
};

// Update task matrix mutation
export const useUpdateTaskMatrixMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, urgency, importance }: { id: string; urgency: number; importance: number }) =>
      apiClient.updateTaskMatrix(id, urgency, importance),
    onSuccess: () => {
      toast.success('Task priority updated');
      queryClient.invalidateQueries({ queryKey: taskKeys.matrix() });
      queryClient.invalidateQueries({ queryKey: taskKeys.matrixStats() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: () => {
      toast.error('Failed to update task priority');
    },
  });
};

// Export all hooks as a single object for easier importing
export const useTaskQueries = () => {
  return {
    useTasksQuery,
    useTaskQuery,
    useTaskStatsQuery,
    useEisenhowerMatrixQuery,
    useMatrixStatsQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useCompleteTaskMutation,
    useUpdateTaskMatrixMutation,
  };
};