// Task management store with Zustand
import { create } from 'zustand';
import { apiClient } from '../lib/api';
import { createPersistedStore, persistenceConfigs, offlineQueue, isOffline } from '../lib/storePersistence';
import type { Task, TaskForm, TaskState, EisenhowerMatrix, MatrixStats } from '../types';

interface TaskStore extends TaskState {
  // Offline queue for pending actions
  offlineQueue: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    payload: any;
    timestamp: number;
  }>;
  
  // Actions
  fetchTasks: (params?: {
    status?: string;
    priority?: number;
    contextType?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createTask: (data: TaskForm) => Promise<Task>;
  updateTask: (id: string, data: Partial<TaskForm>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  setFilters: (filters: Partial<TaskState['filters']>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  
  // Task status actions
  markTaskAsComplete: (id: string) => Promise<Task>;
  markTaskAsInProgress: (id: string) => Promise<Task>;
  
  // Bulk actions
  deleteMultipleTasks: (ids: string[]) => Promise<void>;
  updateMultipleTasks: (ids: string[], data: Partial<TaskForm>) => Promise<void>;
  
  // Statistics
  stats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  fetchStats: () => Promise<void>;
  
  // Eisenhower Matrix
  matrix: EisenhowerMatrix | null;
  matrixStats: MatrixStats | null;
  fetchMatrix: () => Promise<void>;
  fetchMatrixStats: () => Promise<void>;
  updateTaskMatrix: (id: string, urgency: number, importance: number) => Promise<Task>;
  completeTask: (id: string) => Promise<void>;
  
  // Offline functionality
  addToOfflineQueue: (type: 'create' | 'update' | 'delete', payload: any) => void;
  processOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => void;
}

export const useTaskStore = create<TaskStore>()(
  createPersistedStore(
    (set, get) => ({
      // Initial state
      tasks: [],
      currentTask: null,
      isLoading: false,
      filters: {},
      offlineQueue: [],
      stats: {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
      },
      matrix: null,
      matrixStats: null,

  // Actions
  fetchTasks: async (params = {}) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.getTasks(params);
      set({
        tasks: response.data || [],
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTask: async (data) => {
    try {
      if (isOffline()) {
        // Create optimistic task for offline mode
        const optimisticTask: Task = {
          id: `temp-${Date.now()}`,
          ...data,
          status: data.status || 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userId: 'current-user', // This would come from auth store
        };
        
        set((state) => ({
          tasks: [optimisticTask, ...state.tasks],
        }));
        
        get().addToOfflineQueue('create', data);
        return optimisticTask;
      }
      
      const task = await apiClient.createTask(data);
      set((state) => ({
        tasks: [task, ...state.tasks],
      }));
      
      // Update stats
      get().fetchStats();
      return task;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (id, data) => {
    try {
      if (isOffline()) {
        // Optimistic update for offline mode
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...data, updatedAt: Date.now() } : task
          ),
          currentTask: state.currentTask?.id === id 
            ? { ...state.currentTask, ...data, updatedAt: Date.now() } 
            : state.currentTask,
        }));
        
        get().addToOfflineQueue('update', { id, data });
        return get().tasks.find(task => task.id === id)!;
      }
      
      const updatedTask = await apiClient.updateTask(id, data);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
      }));
      
      // Update stats if status changed
      if (data.status) {
        get().fetchStats();
      }
      
      return updatedTask;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      if (isOffline()) {
        // Optimistic delete for offline mode
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          currentTask: state.currentTask?.id === id ? null : state.currentTask,
        }));
        
        get().addToOfflineQueue('delete', { id });
        return;
      }
      
      await apiClient.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
      }));
      
      // Update stats
      get().fetchStats();
    } catch (error) {
      throw error;
    }
  },

  setCurrentTask: (task) => {
    set({ currentTask: task });
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    
    // Fetch tasks with new filters
    get().fetchTasks(get().filters);
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchTasks();
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Task status actions
  markTaskAsComplete: async (id) => {
    return get().updateTask(id, { 
      status: 'completed'
    });
  },

  markTaskAsInProgress: async (id) => {
    return get().updateTask(id, { 
      status: 'in_progress'
    });
  },

  // Bulk actions
  deleteMultipleTasks: async (ids) => {
    try {
      // Delete all tasks in parallel
      await Promise.all(ids.map(id => apiClient.deleteTask(id)));
      
      set((state) => ({
        tasks: state.tasks.filter((task) => !ids.includes(task.id)),
        currentTask: ids.includes(state.currentTask?.id || '') ? null : state.currentTask,
      }));
      
      // Update stats
      get().fetchStats();
    } catch (error) {
      throw error;
    }
  },

  updateMultipleTasks: async (ids, data) => {
    try {
      // Update all tasks in parallel
      const updatedTasks = await Promise.all(
        ids.map(id => apiClient.updateTask(id, data))
      );
      
      set((state) => ({
        tasks: state.tasks.map((task) => {
          const updated = updatedTasks.find(ut => ut.id === task.id);
          return updated || task;
        }),
      }));
      
      // Update stats if status changed
      if (data.status) {
        get().fetchStats();
      }
    } catch (error) {
      throw error;
    }
  },

  // Statistics
  fetchStats: async () => {
    try {
      const stats = await apiClient.getTaskStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  },

  // Eisenhower Matrix
  fetchMatrix: async () => {
    try {
      set({ isLoading: true });
      const matrix = await apiClient.getEisenhowerMatrix();
      set({ matrix, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch Eisenhower matrix:', error);
    }
  },

  fetchMatrixStats: async () => {
    try {
      const matrixStats = await apiClient.getMatrixStats();
      set({ matrixStats });
    } catch (error) {
      console.error('Failed to fetch matrix stats:', error);
    }
  },

  updateTaskMatrix: async (id, urgency, importance) => {
    try {
      const updatedTask = await apiClient.updateTaskMatrix(id, urgency, importance);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
      }));
      
      // Refresh matrix view
      get().fetchMatrix();
      return updatedTask;
    } catch (error) {
      throw error;
    }
  },

  completeTask: async (id) => {
    try {
      if (isOffline()) {
        // Handle offline completion
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, status: 'completed' as const, completedAt: Date.now() } : task
          ),
        }));
        get().addToOfflineQueue('update', { id, data: { status: 'completed' } });
        return;
      }
      
      await apiClient.completeTask(id);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, status: 'completed' as const, completedAt: Date.now() } : task
        ),
      }));
      
      // Update stats and matrix
      get().fetchStats();
      get().fetchMatrix();
    } catch (error) {
      throw error;
    }
  },

  // Offline functionality
  addToOfflineQueue: (type, payload) => {
    const queueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
    };
    
    set((state) => ({
      offlineQueue: [...state.offlineQueue, queueItem],
    }));
    
    // Also add to global offline queue
    offlineQueue.addAction(`task-${type}`, payload);
  },

  processOfflineQueue: async () => {
    const { offlineQueue: queue } = get();
    if (queue.length === 0) return;

    const processedIds: string[] = [];

    for (const item of queue) {
      try {
        switch (item.type) {
          case 'create':
            await apiClient.createTask(item.payload);
            break;
          case 'update':
            await apiClient.updateTask(item.payload.id, item.payload.data);
            break;
          case 'delete':
            await apiClient.deleteTask(item.payload.id);
            break;
        }
        processedIds.push(item.id);
      } catch (error) {
        console.error('Failed to process offline queue item:', item, error);
      }
    }

    // Remove processed items from queue
    if (processedIds.length > 0) {
      set((state) => ({
        offlineQueue: state.offlineQueue.filter(item => !processedIds.includes(item.id)),
      }));
      
      // Refresh data after processing queue
      get().fetchTasks();
      get().fetchStats();
    }
  },

  clearOfflineQueue: () => {
    set({ offlineQueue: [] });
  },
    }),
    persistenceConfigs.tasks
  )
);