// React Query hooks for task management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useTaskStore } from '../../stores/tasks';
import type { Task, TaskForm, EisenhowerMatrix, MatrixStats, TasksResponse } from '../../types';
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

// Tasks list query with Zustand store integration
export const useTasksQuery = (params?: {
  status?: string;
  priority?: number;
  contextType?: string;
  search?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
  quadrant?: string;
  urgency?: number;
  importance?: number;
  isDelegated?: boolean;
}) => {
  const { tasks, setLoading, fetchTasks } = useTaskStore();

  return useQuery({
    queryKey: taskKeys.list(params || {}),
    queryFn: async () => {
      setLoading(true);
      try {
        // Call API and get TasksResponse format: { tasks, hasMore, nextCursor, total }
        const response = await apiClient.getTasks(params);
        
        // Return full response for pagination info, but extract tasks for compatibility
        const tasksData: Task[] = response.tasks || [];
        
        console.log('Fetched tasks from backend:', {
          count: tasksData.length,
          total: response.total,
          hasMore: response.hasMore,
          tasks: tasksData
        });
        
        // Return full response with pagination info
        return {
          tasks: tasksData,
          hasMore: response.hasMore || false,
          nextCursor: response.nextCursor || null,
          total: response.total || tasksData.length
        } as TasksResponse;
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 400 errors (client errors)
      if (error?.response?.status === 400) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
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

// Create task mutation with Zustand store integration
export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();
  const { createTask } = useTaskStore();

  return useMutation({
    mutationFn: (data: TaskForm) => apiClient.createTask(data),
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(taskKeys.lists());

      // Create optimistic task
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        user_id: 'current-user',
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority as 1 | 2 | 3 | 4,
        urgency: newTask.urgency || 3,
        importance: newTask.importance || 3,
        eisenhower_quadrant: newTask.eisenhower_quadrant || 'do',
        status: newTask.status || 'pending',
        due_date: newTask.dueDate || null,
        estimated_duration: newTask.estimatedDuration || null,
        energy_level_required: newTask.energyLevelRequired || null,
        context_type: newTask.contextType || null,
        matrix_notes: newTask.matrixNotes || null,
        is_delegated: newTask.isDelegated || false,
        delegated_to: newTask.delegatedTo || null,
        delegation_notes: newTask.delegationNotes || null,
        ai_priority_score: null,
        ai_planning_session_id: null,
        ai_matrix_confidence: null,
        matrix_last_reviewed: null,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      // Add to store optimistically
      createTask(optimisticTask);

      // Update query cache
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: any) => {
          // Handle both array format (new) and object format (legacy)
          if (Array.isArray(old)) {
            return [optimisticTask, ...old];
          }
          if (old?.tasks && Array.isArray(old.tasks)) {
            return { ...old, tasks: [optimisticTask, ...old.tasks] };
          }
          if (old?.data && Array.isArray(old.data)) {
            return { ...old, data: [optimisticTask, ...old.data] };
          }
          return [optimisticTask];
        }
      );

      return { previousTasks, optimisticTask };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: taskKeys.lists() }, context.previousTasks);
      }
      if (context?.optimisticTask) {
        // Remove from store
        const { deleteTask } = useTaskStore.getState();
        deleteTask(context.optimisticTask.id);
      }
      toast.error('Failed to create task');
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic task with real data in query cache
      if (context?.optimisticTask) {
        // Update query cache: replace optimistic task with real task
        queryClient.setQueriesData(
          { queryKey: taskKeys.lists() },
          (old: any) => {
            // Handle both array format (new) and object format (legacy)
            if (Array.isArray(old)) {
              // Remove optimistic task and add real task at the beginning
              return [data, ...old.filter((task: Task) => task.id !== context.optimisticTask.id)];
            }
            if (old?.tasks && Array.isArray(old.tasks)) {
              return {
                ...old,
                tasks: [data, ...old.tasks.filter((task: Task) => task.id !== context.optimisticTask.id)]
              };
            }
            if (old?.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: [data, ...old.data.filter((task: Task) => task.id !== context.optimisticTask.id)]
              };
            }
            return old;
          }
        );
        
        // Update store: remove optimistic task and add real task directly
        const { deleteTask, tasks } = useTaskStore.getState();
        deleteTask(context.optimisticTask.id);
        // Add real task to store directly (without API call)
        useTaskStore.setState({
          tasks: [data, ...tasks.filter(t => t.id !== context.optimisticTask.id)]
        });
      }
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
        updated_at: Date.now(),
      }));

      // Optimistically update task lists
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: any) => {
          // Handle both array format (new) and object format (legacy)
          if (Array.isArray(old)) {
            return old.map((task: Task) =>
              task.id === id ? { ...task, ...data, updated_at: Date.now() } : task
            );
          }
          if (old?.tasks && Array.isArray(old.tasks)) {
            return {
              ...old,
              tasks: old.tasks.map((task: Task) =>
                task.id === id ? { ...task, ...data, updated_at: Date.now() } : task
              ),
            };
          }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.map((task: Task) =>
                task.id === id ? { ...task, ...data, updated_at: Date.now() } : task
              ),
            };
          }
          return old;
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
          // Handle both array format (new) and object format (legacy)
          if (Array.isArray(old)) {
            return old.filter((task: Task) => task.id !== id);
          }
          if (old?.tasks && Array.isArray(old.tasks)) {
            return {
              ...old,
              tasks: old.tasks.filter((task: Task) => task.id !== id),
            };
          }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.filter((task: Task) => task.id !== id),
            };
          }
          return old;
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
          // Handle both array format (new) and object format (legacy)
          if (Array.isArray(old)) {
            return old.map((task: Task) =>
              task.id === id
                ? { ...task, status: 'done' as const, completed_at: Date.now() }
                : task
            );
          }
          if (old?.tasks && Array.isArray(old.tasks)) {
            return {
              ...old,
              tasks: old.tasks.map((task: Task) =>
                task.id === id
                  ? { ...task, status: 'done' as const, completed_at: Date.now() }
                  : task
              ),
            };
          }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.map((task: Task) =>
                task.id === id
                  ? { ...task, status: 'done' as const, completed_at: Date.now() }
                  : task
              ),
            };
          }
          return old;
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