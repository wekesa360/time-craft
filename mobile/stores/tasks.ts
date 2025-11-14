// Task management store with Zustand for React Native
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, notify } from '../lib/api';
import { notificationService } from '../lib/notifications';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types';

interface TaskStore {
  // State
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean; // compatibility
  isFetching: boolean;
  isMutating: boolean;
  filters: { status?: string; priority?: number; contextType?: string };

  // Actions
  fetchTasks: (params?: { status?: string; priority?: number; contextType?: string }) => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskRequest) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  setFilters: (filters: Partial<TaskStore['filters']>) => void;
  setLoading: (loading: boolean) => void;
  refreshTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      currentTask: null,
      isLoading: false,
      isFetching: false,
      isMutating: false,
      filters: {},

      // Actions
      setLoading: (isLoading) => {
        set({ isLoading, isMutating: isLoading });
      },

      setCurrentTask: (currentTask) => {
        set({ currentTask });
      },

      setFilters: (newFilters) => {
        const currentFilters = get().filters;
        set({ filters: { ...currentFilters, ...newFilters } });
      },

      fetchTasks: async (params) => {
        try {
          set({ isLoading: true, isFetching: true });
          const response = await apiClient.getTasks(params);
          // apiClient.getTasks currently returns response.data from axios.
          // Support multiple backend shapes: array, { tasks: [...] }, or nested { data: { tasks: [...] } }
          const tasks = Array.isArray(response)
            ? response
            : (response?.tasks || response?.data?.tasks || []);
          set({ 
            tasks,
            isLoading: false,
            isFetching: false 
          });
        } catch (error) {
          set({ isLoading: false, isFetching: false });
          console.error('Failed to fetch tasks:', error);
          notify.error('Failed to load tasks');
        }
      },

      createTask: async (data) => {
        try {
          set({ isLoading: true, isMutating: true });
          const createResult = await apiClient.createTask(data);
          // Support both direct Task return and envelope { task }
          const newTask = (createResult as any)?.task ?? createResult;
          const currentTasks = get().tasks;
          set({ 
            tasks: [newTask, ...currentTasks],
            isLoading: false,
            isMutating: false 
          });
          
          // Schedule notification if task has a due date
          if (newTask.dueDate) {
            try {
              await notificationService.scheduleTaskReminder(
                newTask.id,
                newTask.title,
                new Date(newTask.dueDate)
              );
            } catch (notificationError) {
              console.warn('Failed to schedule task reminder:', notificationError);
            }
          }
          
          notify.success('Task created successfully');
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          console.error('Failed to create task:', error);
          notify.error('Failed to create task');
          throw error;
        }
      },

      updateTask: async (id, data) => {
        try {
          set({ isLoading: true, isMutating: true });
          const updateResult = await apiClient.updateTask(id, data);
          // Support both direct Task return and envelope { task }
          const updatedTask = (updateResult as any)?.task ?? updateResult;
          const currentTasks = get().tasks;
          const updatedTasks = currentTasks.map(task => 
            task.id === id ? updatedTask : task
          );
          set({ 
            tasks: updatedTasks,
            currentTask: get().currentTask?.id === id ? updatedTask : get().currentTask,
            isLoading: false,
            isMutating: false 
          });
          
          // Update notification if due date changed
          if (data.dueDate && updatedTask.dueDate) {
            try {
              await notificationService.scheduleTaskReminder(
                updatedTask.id,
                updatedTask.title,
                new Date(updatedTask.dueDate)
              );
            } catch (notificationError) {
              console.warn('Failed to update task reminder:', notificationError);
            }
          }
          
          notify.success('Task updated successfully');
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          console.error('Failed to update task:', error);
          notify.error('Failed to update task');
          throw error;
        }
      },

      deleteTask: async (id) => {
        try {
          set({ isLoading: true, isMutating: true });
          await apiClient.deleteTask(id);
          
          // Cancel any scheduled notification for this task
          try {
            await notificationService.cancelNotification(id);
          } catch (notificationError) {
            console.warn('Failed to cancel task notification:', notificationError);
          }
          
          const currentTasks = get().tasks;
          const filteredTasks = currentTasks.filter(task => task.id !== id);
          set({ 
            tasks: filteredTasks,
            currentTask: get().currentTask?.id === id ? null : get().currentTask,
            isLoading: false,
            isMutating: false 
          });
          notify.success('Task deleted successfully');
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          console.error('Failed to delete task:', error);
          notify.error('Failed to delete task');
          throw error;
        }
      },

      toggleTaskComplete: async (id) => {
        try {
          const task = get().tasks.find(t => t.id === id);
          if (!task) return;

          const newStatus = task.status === 'done' ? 'pending' : 'done';
          await get().updateTask(id, { status: newStatus });
        } catch (error) {
          console.error('Failed to toggle task completion:', error);
          throw error;
        }
      },

      refreshTasks: async () => {
        const filters = get().filters;
        await get().fetchTasks(filters);
      },
    }),
    {
      name: 'task-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        filters: state.filters,
      }),
    }
  )
);