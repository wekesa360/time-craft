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
  security: () => [...adminKeys.all, 'security'] as const,
  securityEvents: (timeRange: string, filters?: any) => [...adminKeys.security(), 'events', timeRange, filters] as const,
  securityStats: (timeRange: string) => [...adminKeys.security(), 'stats', timeRange] as const,
  threatIntelligence: (timeRange: string) => [...adminKeys.security(), 'threats', timeRange] as const,
  complianceReport: (timeRange: string) => [...adminKeys.security(), 'compliance', timeRange] as const,
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

// Security queries
export const useAdminQueries = {
  // Security events query
  useSecurityEvents: (timeRange: string, filters?: any) => {
    return useQuery({
      queryKey: adminKeys.securityEvents(timeRange, filters),
      queryFn: () => apiClient.admin.getSecurityEvents(timeRange, filters),
      staleTime: 30 * 1000, // 30 seconds for real-time security data
    });
  },

  // Security statistics query
  useSecurityStats: (timeRange: string) => {
    return useQuery({
      queryKey: adminKeys.securityStats(timeRange),
      queryFn: () => apiClient.admin.getSecurityStats(timeRange),
      staleTime: 60 * 1000, // 1 minute
    });
  },

  // Threat intelligence query
  useThreatIntelligence: (timeRange: string) => {
    return useQuery({
      queryKey: adminKeys.threatIntelligence(timeRange),
      queryFn: () => apiClient.admin.getThreatIntelligence(timeRange),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  // Compliance report query
  useComplianceReport: (timeRange: string) => {
    return useQuery({
      queryKey: adminKeys.complianceReport(timeRange),
      queryFn: () => apiClient.admin.getComplianceReport(timeRange),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },

  // Audit logs query
  useAuditLogs: (timeRange: string, filters?: any) => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'audit-logs', timeRange, filters],
      queryFn: () => apiClient.admin.getAuditLogs(timeRange, filters),
      staleTime: 30 * 1000,
    });
  },

  // Security incidents query
  useSecurityIncidents: (timeRange: string, status?: string) => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'incidents', timeRange, status],
      queryFn: () => apiClient.admin.getSecurityIncidents(timeRange, status),
      staleTime: 60 * 1000,
    });
  },

  // User security status query
  useUserSecurityStatus: (userId: string) => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'user-status', userId],
      queryFn: () => apiClient.admin.getUserSecurityStatus(userId),
      staleTime: 5 * 60 * 1000,
    });
  },

  // Security policies query
  useSecurityPolicies: () => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'policies'],
      queryFn: () => apiClient.admin.getSecurityPolicies(),
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  },

  // Security alerts query
  useSecurityAlerts: (timeRange: string) => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'alerts', timeRange],
      queryFn: () => apiClient.admin.getSecurityAlerts(timeRange),
      staleTime: 30 * 1000,
    });
  },

  // Data access logs query
  useDataAccessLogs: (timeRange: string, userId?: string) => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'data-access', timeRange, userId],
      queryFn: () => apiClient.admin.getDataAccessLogs(timeRange, userId),
      staleTime: 60 * 1000,
    });
  },

  // API access logs query
  useApiAccessLogs: (timeRange: string, endpoint?: string) => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'api-access', timeRange, endpoint],
      queryFn: () => apiClient.admin.getApiAccessLogs(timeRange, endpoint),
      staleTime: 60 * 1000,
    });
  },

  // Security metrics query
  useSecurityMetrics: (timeRange: string) => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'metrics', timeRange],
      queryFn: () => apiClient.admin.getSecurityMetrics(timeRange),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  },

  // Risk assessment query
  useRiskAssessment: (timeRange: string) => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'risk-assessment', timeRange],
      queryFn: () => apiClient.admin.getRiskAssessment(timeRange),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },

  // Security recommendations query
  useSecurityRecommendations: () => {
    return useQuery({
      queryKey: [...adminKeys.security(), 'recommendations'],
      queryFn: () => apiClient.admin.getSecurityRecommendations(),
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  }
};