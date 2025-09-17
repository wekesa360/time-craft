// React Query hooks for notifications
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { Notification, NotificationPreferences } from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  history: () => [...notificationKeys.all, 'history'] as const,
  historyList: (filters: Record<string, any>) => [...notificationKeys.history(), { filters }] as const,
  templates: () => [...notificationKeys.all, 'templates'] as const,
};

// Notification preferences query
export const useNotificationPreferencesQuery = () => {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => apiClient.getNotificationPreferences(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Notification history query
export const useNotificationHistoryQuery = (params?: { limit?: number; type?: string }) => {
  return useQuery({
    queryKey: notificationKeys.historyList(params || {}),
    queryFn: () => apiClient.getNotificationHistory(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Notification templates query
export const useNotificationTemplatesQuery = () => {
  return useQuery({
    queryKey: notificationKeys.templates(),
    queryFn: () => apiClient.getNotificationTemplates(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Register device mutation
export const useRegisterDeviceMutation = () => {
  return useMutation({
    mutationFn: (data: { deviceToken: string; platform: string; appVersion: string }) =>
      apiClient.registerDevice(data),
    onSuccess: () => {
      toast.success('Device registered for notifications');
    },
    onError: () => {
      toast.error('Failed to register device');
    },
  });
};

// Update notification preferences mutation
export const useUpdateNotificationPreferencesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      apiClient.updateNotificationPreferences(preferences),
    onMutate: async (newPreferences) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences() });

      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData(notificationKeys.preferences());

      // Optimistically update
      queryClient.setQueryData(notificationKeys.preferences(), newPreferences);

      return { previousPreferences };
    },
    onError: (err, newPreferences, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(notificationKeys.preferences(), context.previousPreferences);
      }
      toast.error('Failed to update notification preferences');
    },
    onSuccess: () => {
      toast.success('Notification preferences updated!');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
};

// Send notification mutation (for testing/admin)
export const useSendNotificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { type: string; title: string; message: string; data?: any }) =>
      apiClient.sendNotification(data),
    onSuccess: () => {
      toast.success('Notification sent!');
      queryClient.invalidateQueries({ queryKey: notificationKeys.history() });
    },
    onError: () => {
      toast.error('Failed to send notification');
    },
  });
};