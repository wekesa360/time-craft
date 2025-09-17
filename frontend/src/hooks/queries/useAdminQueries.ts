// React Query hooks for admin features
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { AdminStats, FeatureFlag, SupportTicket, SystemMetrics } from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
  metrics: () => [...adminKeys.all, 'metrics'] as const,
  featureFlags: () => [...adminKeys.all, 'feature-flags'] as const,
  supportTickets: () => [...adminKeys.all, 'support-tickets'] as const,
};

// Admin dashboard query
export const useAdminDashboardQuery = () => {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => apiClient.getAdminDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Admin analytics query
export const useAdminAnalyticsQuery = () => {
  return useQuery({
    queryKey: adminKeys.analytics(),
    queryFn: () => apiClient.getAdminAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// System metrics query
export const useSystemMetricsQuery = () => {
  return useQuery({
    queryKey: adminKeys.metrics(),
    queryFn: () => apiClient.getSystemMetrics(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time metrics
  });
};

// Feature flags query
export const useFeatureFlagsQuery = () => {
  return useQuery({
    queryKey: adminKeys.featureFlags(),
    queryFn: () => apiClient.getFeatureFlags(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create support ticket mutation
export const useCreateSupportTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<SupportTicket, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) =>
      apiClient.createSupportTicket(data),
    onSuccess: () => {
      toast.success('🎫 Support ticket created!');
      queryClient.invalidateQueries({ queryKey: adminKeys.supportTickets() });
    },
    onError: () => {
      toast.error('Failed to create support ticket');
    },
  });
};

// Update feature flag mutation
export const useUpdateFeatureFlagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeatureFlag> }) =>
      apiClient.updateFeatureFlag(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminKeys.featureFlags() });

      // Snapshot previous value
      const previousFlags = queryClient.getQueryData(adminKeys.featureFlags());

      // Optimistically update
      queryClient.setQueryData(adminKeys.featureFlags(), (old: FeatureFlag[]) =>
        old?.map(flag => flag.id === id ? { ...flag, ...data } : flag) || []
      );

      return { previousFlags };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousFlags) {
        queryClient.setQueryData(adminKeys.featureFlags(), context.previousFlags);
      }
      toast.error('Failed to update feature flag');
    },
    onSuccess: () => {
      toast.success('Feature flag updated!');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: adminKeys.featureFlags() });
    },
  });
};