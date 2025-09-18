/**
 * Task Management API hooks using React Query
 * Handles task CRUD operations, filtering, and real-time updates
 */

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/api';
import { queryKeys, getErrorMessage } from '../../lib/queryClient';
import { useTaskStore } from '../../stores/tasks';
import type { Task, TaskForm, TasksResponse, TaskResponse } from '../../types';

interface TaskFilters {
  status?: string;
  priority?: number;
  contextType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// API functions
const taskApi = {
  // Get tasks with filters and pagination
  getTasks: async (filters: TaskFilters = {}): Promise<TasksResponse> => {
    const response = await apiClient.getTasks(filters);
    return response as unknown as TasksResponse;
  },

  // Get single task
  getTask: async (id: string): Promise<Task> => {
    const response = await apiClient.getTask(id);
    return response as Task;
  },

  // Create task
  createTask: async (data: TaskForm): Promise<Task> => {
    // Map form data to backend format
    const backendData = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      urgency: data.urgency,
      importance: data.importance,
      eisenhower_quadrant: data.eisenhower_quadrant,
      due_date: data.dueDate,
      estimated_duration: data.estimatedDuration,
      context_type: data.contextType,
      matrix_notes: data.matrixNotes,
      is_delegated: data.isDelegated,
      delegated_to: data.delegatedTo,
      delegation_notes: data.delegationNotes,
    };
    const response = await apiClient.createTask(backendData);
    return response;
  },

  // Update task
  updateTask: async (id: string, data: Partial<TaskForm>): Promise<Task> => {
    // Map form data to backend format
    const backendData: any = {};
    if (data.title !== undefined) backendData.title = data.title;
    if (data.description !== undefined) backendData.description = data.description;
    if (data.priority !== undefined) backendData.priority = data.priority;
    if (data.urgency !== undefined) backendData.urgency = data.urgency;
    if (data.importance !== undefined) backendData.importance = data.importance;
    if (data.eisenhower_quadrant !== undefined) backendData.eisenhower_quadrant = data.eisenhower_quadrant;
    if (data.dueDate !== undefined) backendData.due_date = data.dueDate;
    if (data.estimatedDuration !== undefined) backendData.estimated_duration = data.estimatedDuration;
    if (data.contextType !== undefined) backendData.context_type = data.contextType;
    if (data.matrixNotes !== undefined) backendData.matrix_notes = data.matrixNotes;
    if (data.isDelegated !== undefined) backendData.is_delegated = data.isDelegated;
    if (data.delegatedTo !== undefined) backendData.delegated_to = data.delegatedTo;
    if (data.delegationNotes !== undefined) backendData.delegation_notes = data.delegationNotes;
    if (data.status !== undefined) backendData.status = data.status;
    
    const response = await apiClient.updateTask(id, backendData);
    return response;
  },

  // Delete task
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.deleteTask(id);
  },

  // Get task statistics
  getTaskStats: async (): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> => {
    const response = await apiClient.getTaskStats();
    return response;
  },

  // Get Eisenhower Matrix
  getEisenhowerMatrix: async () => {
    const response = await apiClient.getEisenhowerMatrix();
    return response;
  },

  // Get Matrix Stats
  getMatrixStats: async () => {
    const response = await apiClient.getMatrixStats();
    return response;
  },

  // Update task matrix position
  updateTaskMatrix: async (id: string, urgency: number, importance: number): Promise<Task> => {
    const response = await apiClient.updateTaskMatrix(id, urgency, importance);
    return response;
  },

  // Complete task
  completeTask: async (id: string): Promise<void> => {
    await apiClient.completeTask(id);
  },
};

// Hooks

/**
 * Get tasks with filters and pagination
 */
export const useTasks = (filters: TaskFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => taskApi.getTasks(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Get tasks with infinite scroll
 */
export const useInfiniteTasks = (filters: Omit<TaskFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.list({ ...filters, infinite: true }),
    queryFn: ({ pageParam = 1 }) => taskApi.getTasks({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: TasksResponse) => {
      return lastPage.hasMore ? (lastPage.nextCursor ? parseInt(lastPage.nextCursor) : undefined) : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get single task
 */
export const useTask = (id: string) => {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => taskApi.getTask(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create task mutation
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.createTask,
    onSuccess: (newTask) => {
      // Invalidate tasks lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list({}) });
      
      // Add to cache
      queryClient.setQueryData(queryKeys.tasks.detail(newTask.id), newTask);
      
      toast.success('Task created successfully');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Failed to create task');
      toast.error(message);
    },
  });
};

/**
 * Update task mutation
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskForm> }) => 
      taskApi.updateTask(id, data),
    onSuccess: (updatedTask) => {
      // Update task in cache
      queryClient.setQueryData(queryKeys.tasks.detail(updatedTask.id), updatedTask);
      
      // Invalidate tasks lists to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list({}) });
      
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Failed to update task');
      toast.error(message);
    },
  });
};

/**
 * Delete task mutation
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.deleteTask,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(deletedId) });
      
      // Invalidate tasks lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list({}) });
      
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Failed to delete task');
      toast.error(message);
    },
  });
};

/**
 * Get task statistics
 */
export const useTaskStats = () => {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'stats'],
    queryFn: taskApi.getTaskStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry failed stats requests
    meta: {
      errorMessage: 'Unable to load task statistics',
    },
  });
};

/**
 * Get Eisenhower Matrix
 */
export const useEisenhowerMatrix = () => {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'matrix'],
    queryFn: taskApi.getEisenhowerMatrix,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false, // Don't retry failed matrix requests
    meta: {
      errorMessage: 'Matrix view temporarily unavailable',
    },
  });
};

/**
 * Get Matrix Statistics
 */
export const useMatrixStats = () => {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'matrix-stats'],
    queryFn: taskApi.getMatrixStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry failed matrix stats requests
    meta: {
      errorMessage: 'Matrix statistics temporarily unavailable',
    },
  });
};

/**
 * Update task matrix position mutation
 */
export const useUpdateTaskMatrix = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, urgency, importance }: { id: string; urgency: number; importance: number }) => 
      taskApi.updateTaskMatrix(id, urgency, importance),
    onSuccess: (updatedTask) => {
      // Update task in cache
      queryClient.setQueryData(queryKeys.tasks.detail(updatedTask.id), updatedTask);
      
      // Invalidate matrix and lists
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'matrix'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list({}) });
      
      toast.success('Task position updated');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Failed to update task position');
      toast.error(message);
    },
  });
};

/**
 * Complete task mutation
 */
export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.completeTask,
    onSuccess: (_, taskId) => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      
      toast.success('Task completed!');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Failed to complete task');
      toast.error(message);
    },
  });
};

// Utility hooks

/**
 * Optimistic task update
 */
export const useOptimisticTaskUpdate = () => {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateTask();

  return {
    updateTask: (id: string, data: Partial<TaskForm>) => {
      // Optimistically update the cache
      const previousTask = queryClient.getQueryData(queryKeys.tasks.detail(id));
      
      if (previousTask) {
        queryClient.setQueryData(queryKeys.tasks.detail(id), {
          ...(previousTask as any),
          ...data,
          updatedAt: Date.now(),
        });
      }

      // Perform the actual update
      updateMutation.mutate(
        { id, data },
        {
          onError: () => {
            // Revert on error
            if (previousTask) {
              queryClient.setQueryData(queryKeys.tasks.detail(id), previousTask);
            }
          },
        }
      );
    },
    isLoading: updateMutation.isPending,
    error: updateMutation.error,
  };
};

/**
 * Prefetch task data
 */
export const usePrefetchTask = () => {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.detail(id),
      queryFn: () => taskApi.getTask(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};