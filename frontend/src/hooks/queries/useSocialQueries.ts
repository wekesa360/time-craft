// React Query hooks for social features
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { Connection, Challenge, ActivityFeedItem } from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const socialKeys = {
  all: ['social'] as const,
  connections: () => [...socialKeys.all, 'connections'] as const,
  challenges: () => [...socialKeys.all, 'challenges'] as const,
  publicChallenges: () => [...socialKeys.challenges(), 'public'] as const,
  activityFeed: () => [...socialKeys.all, 'activity-feed'] as const,
};

// Connections query (all connections)
export const useConnectionsQuery = () => {
  return useQuery({
    queryKey: socialKeys.connections(),
    queryFn: async () => {
      const [acceptedResponse, pendingResponse] = await Promise.all([
        apiClient.getConnections({ status: 'accepted' }),
        apiClient.getConnections({ status: 'pending' })
      ]);
      
      return {
        connections: acceptedResponse.data || [],
        pendingRequests: pendingResponse.data || []
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Accepted connections query
export const useAcceptedConnectionsQuery = () => {
  return useQuery({
    queryKey: [...socialKeys.connections(), 'accepted'],
    queryFn: async () => {
      const response = await apiClient.getConnections({ status: 'accepted' });
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Pending connections query
export const usePendingConnectionsQuery = () => {
  return useQuery({
    queryKey: [...socialKeys.connections(), 'pending'],
    queryFn: async () => {
      const response = await apiClient.getConnections({ status: 'pending' });
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Challenges query (includes user's challenges)
export const useChallengesQuery = () => {
  return useQuery({
    queryKey: socialKeys.challenges(),
    queryFn: () => apiClient.getChallenges(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Public challenges query
export const usePublicChallengesQuery = () => {
  return useQuery({
    queryKey: socialKeys.publicChallenges(),
    queryFn: () => apiClient.getPublicChallenges(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Activity feed query
export const useActivityFeedQuery = () => {
  return useQuery({
    queryKey: socialKeys.activityFeed(),
    queryFn: async () => {
      try {
        const feed = await apiClient.getActivityFeed();
        return feed || []; // Return empty array if undefined
      } catch (error) {
        console.error('Failed to fetch activity feed:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Send connection request mutation
export const useSendConnectionRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; message?: string }) =>
      apiClient.sendConnectionRequest(data),
    onSuccess: () => {
      toast.success('Connection request sent!');
      queryClient.invalidateQueries({ queryKey: socialKeys.connections() });
    },
    onError: () => {
      toast.error('Failed to send connection request');
    },
  });
};

// Accept connection mutation
export const useAcceptConnectionRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.acceptConnectionRequest(id),
    onSuccess: () => {
      toast.success('Connection accepted!');
      queryClient.invalidateQueries({ queryKey: socialKeys.connections() });
    },
    onError: () => {
      toast.error('Failed to accept connection');
    },
  });
};

// Decline connection mutation
export const useDeclineConnectionRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.declineConnectionRequest(id),
    onSuccess: () => {
      toast('Connection declined');
      queryClient.invalidateQueries({ queryKey: socialKeys.connections() });
    },
    onError: () => {
      toast.error('Failed to decline connection');
    },
  });
};

// Create challenge mutation
export const useCreateChallengeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Challenge, 'id' | 'createdBy' | 'participants' | 'leaderboard' | 'isActive'>) =>
      apiClient.createChallenge(data),
    onSuccess: () => {
      toast.success('🏆 Challenge created!');
      queryClient.invalidateQueries({ queryKey: socialKeys.publicChallenges() });
    },
    onError: () => {
      toast.error('Failed to create challenge');
    },
  });
};

// Join challenge mutation
export const useJoinChallengeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.joinChallenge(id),
    onSuccess: () => {
      toast.success('🎯 Joined challenge!');
      queryClient.invalidateQueries({ queryKey: socialKeys.challenges() });
      queryClient.invalidateQueries({ queryKey: socialKeys.publicChallenges() });
    },
    onError: () => {
      toast.error('Failed to join challenge');
    },
  });
};

// Leave challenge mutation
export const useLeaveChallengeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.leaveChallenge(id),
    onSuccess: () => {
      toast('Left challenge');
      queryClient.invalidateQueries({ queryKey: socialKeys.challenges() });
      queryClient.invalidateQueries({ queryKey: socialKeys.publicChallenges() });
    },
    onError: () => {
      toast.error('Failed to leave challenge');
    },
  });
};

// Share achievement mutation
export const useShareAchievementMutation = () => {
  return useMutation({
    mutationFn: (data: { type: string; content: any; platform?: string }) =>
      apiClient.shareAchievement(data),
    onSuccess: () => {
      toast.success('Achievement shared!');
    },
    onError: () => {
      toast.error('Failed to share achievement');
    },
  });
};

// Export all hooks as a single object for easier importing
export const useSocialQueries = () => {
  return {
    useConnectionsQuery,
    useAcceptedConnectionsQuery,
    usePendingConnectionsQuery,
    useChallengesQuery,
    usePublicChallengesQuery,
    useActivityFeedQuery,
    useSendConnectionRequestMutation,
    useAcceptConnectionRequestMutation,
    useDeclineConnectionRequestMutation,
    useCreateChallengeMutation,
    useJoinChallengeMutation,
    useLeaveChallengeMutation,
    useShareAchievementMutation,
  };
};