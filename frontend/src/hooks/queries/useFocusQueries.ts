// React Query hooks for focus sessions
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api";
import type {
  FocusSession,
  SessionTemplate,
  FocusEnvironment,
  Distraction,
} from "../../types";
import { toast } from "react-hot-toast";

// Query keys
export const focusKeys = {
  all: ["focus"] as const,
  templates: () => [...focusKeys.all, "templates"] as const,
  sessions: () => [...focusKeys.all, "sessions"] as const,
  sessionsList: (filters: Record<string, unknown>) =>
    [...focusKeys.sessions(), { filters }] as const,
  session: (id: string) => [...focusKeys.sessions(), id] as const,
  environments: () => [...focusKeys.all, "environments"] as const,
  dashboard: () => [...focusKeys.all, "dashboard"] as const,
  analytics: (period?: string) =>
    [...focusKeys.all, "analytics", { period }] as const,
  distractions: (sessionId: string) =>
    [...focusKeys.session(sessionId), "distractions"] as const,
};

// Focus templates query
export const useFocusTemplatesQuery = () => {
  return useQuery({
    queryKey: focusKeys.templates(),
    queryFn: () => apiClient.getFocusTemplates(),
    staleTime: 30 * 60 * 1000, // 30 minutes (templates rarely change)
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

// Focus sessions query
export const useFocusSessionsQuery = (params?: {
  status?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: focusKeys.sessionsList(params || {}),
    queryFn: () => apiClient.getFocusSessions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Single focus session query
export const useFocusSessionQuery = (id: string) => {
  return useQuery({
    queryKey: focusKeys.session(id),
    queryFn: () => apiClient.getFocusSession(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds (active sessions change frequently)
  });
};

// Focus environments query
export const useFocusEnvironmentsQuery = () => {
  return useQuery({
    queryKey: focusKeys.environments(),
    queryFn: () => apiClient.getFocusEnvironments(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Focus dashboard query
export const useFocusDashboardQuery = () => {
  return useQuery({
    queryKey: focusKeys.dashboard(),
    queryFn: () => apiClient.getFocusDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Focus analytics query
export const useFocusAnalyticsQuery = (period?: string) => {
  return useQuery({
    queryKey: focusKeys.analytics(period),
    queryFn: () => apiClient.getFocusAnalytics(period),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Session distractions query
export const useSessionDistractionsQuery = (sessionId: string) => {
  return useQuery({
    queryKey: focusKeys.distractions(sessionId),
    queryFn: () => apiClient.getSessionDistractions(sessionId),
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Start focus session mutation
export const useStartFocusSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      templateKey: string;
      taskId?: string;
      environmentId?: string;
    }) => apiClient.startFocusSession(data),
    onSuccess: (session) => {
      toast.success(`🎯 Focus session started: ${session.templateKey}`);
      queryClient.invalidateQueries({ queryKey: focusKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: focusKeys.dashboard() });
    },
    onError: () => {
      toast.error("Failed to start focus session");
    },
  });
};

// Complete focus session mutation
export const useCompleteFocusSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        actualEndTime: number;
        productivityRating: number;
        notes?: string;
      };
    }) => apiClient.completeFocusSession(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: focusKeys.session(id) });

      // Snapshot previous value
      const previousSession = queryClient.getQueryData(focusKeys.session(id));

      // Optimistically update
      queryClient.setQueryData(focusKeys.session(id), (old: FocusSession) => ({
        ...old,
        status: "completed" as const,
        actualEndTime: data.actualEndTime,
        productivityRating: data.productivityRating,
        notes: data.notes,
      }));

      return { previousSession };
    },
    onError: (err, { id }, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          focusKeys.session(id),
          context.previousSession
        );
      }
      toast.error("Failed to complete focus session");
    },
    onSuccess: (session) => {
      toast.success(
        `🎉 Focus session completed! Rating: ${session.productivityRating}/10`
      );
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: focusKeys.session(id) });
      queryClient.invalidateQueries({ queryKey: focusKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: focusKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: focusKeys.analytics() });
    },
  });
};

// Pause focus session mutation
export const usePauseFocusSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.pauseFocusSession(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: focusKeys.session(id) });

      const previousSession = queryClient.getQueryData(focusKeys.session(id));

      queryClient.setQueryData(focusKeys.session(id), (old: FocusSession) => ({
        ...old,
        status: "paused" as const,
      }));

      return { previousSession };
    },
    onError: (err, id, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          focusKeys.session(id),
          context.previousSession
        );
      }
      toast.error("Failed to pause focus session");
    },
    onSuccess: () => {
      toast("⏸️ Focus session paused");
    },
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: focusKeys.session(id) });
    },
  });
};

// Resume focus session mutation
export const useResumeFocusSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.resumeFocusSession(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: focusKeys.session(id) });

      const previousSession = queryClient.getQueryData(focusKeys.session(id));

      queryClient.setQueryData(focusKeys.session(id), (old: FocusSession) => ({
        ...old,
        status: "active" as const,
      }));

      return { previousSession };
    },
    onError: (err, id, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          focusKeys.session(id),
          context.previousSession
        );
      }
      toast.error("Failed to resume focus session");
    },
    onSuccess: () => {
      toast.success("▶️ Focus session resumed");
    },
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: focusKeys.session(id) });
    },
  });
};

// Cancel focus session mutation
export const useCancelFocusSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.cancelFocusSession(id),
    onSuccess: () => {
      toast("Focus session cancelled");
      queryClient.invalidateQueries({ queryKey: focusKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: focusKeys.dashboard() });
    },
    onError: () => {
      toast.error("Failed to cancel focus session");
    },
  });
};

// Log distraction mutation
export const useLogDistractionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: { type: string; description?: string };
    }) => apiClient.logDistraction(sessionId, data),
    onMutate: async ({ sessionId, data }) => {
      await queryClient.cancelQueries({
        queryKey: focusKeys.distractions(sessionId),
      });

      const previousDistractions = queryClient.getQueryData(
        focusKeys.distractions(sessionId)
      );

      const optimisticDistraction: Distraction = {
        id: `temp-${Date.now()}`,
        sessionId,
        type: data.type,
        description: data.description,
        timestamp: Date.now(),
      };

      queryClient.setQueryData(
        focusKeys.distractions(sessionId),
        (old: Distraction[]) => [...(old || []), optimisticDistraction]
      );

      return { previousDistractions };
    },
    onError: (err, { sessionId }, context) => {
      if (context?.previousDistractions) {
        queryClient.setQueryData(
          focusKeys.distractions(sessionId),
          context.previousDistractions
        );
      }
      toast.error("Failed to log distraction");
    },
    onSuccess: () => {
      toast("Distraction logged");
    },
    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: focusKeys.distractions(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: focusKeys.session(sessionId) });
    },
  });
};

// Create focus environment mutation
export const useCreateFocusEnvironmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<FocusEnvironment, "id" | "userId">) =>
      apiClient.createFocusEnvironment(data),
    onSuccess: () => {
      toast.success("🏠 Focus environment created!");
      queryClient.invalidateQueries({ queryKey: focusKeys.environments() });
    },
    onError: () => {
      toast.error("Failed to create focus environment");
    },
  });
};

// Export all hooks as a single object for easier importing
export const useFocusQueries = () => {
  return {
    useFocusTemplatesQuery,
    useFocusSessionsQuery,
    useFocusSessionQuery,
    useFocusEnvironmentsQuery,
    useFocusDashboardQuery,
    useFocusAnalyticsQuery,
    useSessionDistractionsQuery,
    useStartFocusSessionMutation,
    useCompleteFocusSessionMutation,
    usePauseFocusSessionMutation,
    useResumeFocusSessionMutation,
    useCancelFocusSessionMutation,
    useLogDistractionMutation,
    useCreateFocusEnvironmentMutation,
  };
};
