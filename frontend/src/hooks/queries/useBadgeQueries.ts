// React Query hooks for badge system
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { Badge, LeaderboardEntry } from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const badgeKeys = {
  all: ['badges'] as const,
  user: () => [...badgeKeys.all, 'user'] as const,
  leaderboard: () => [...badgeKeys.all, 'leaderboard'] as const,
};

// User badges query
export const useBadgesQuery = () => {
  return useQuery({
    queryKey: badgeKeys.user(),
    queryFn: async () => {
      const data = await apiClient.getBadges();
      console.log('useBadgesQuery - fetched badges:', {
        badgesCount: data?.badges?.length || 0,
        totalBadges: data?.totalBadges,
        unlockedBadges: data?.unlockedBadges,
        data
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Badge leaderboard query
export const useBadgeLeaderboardQuery = () => {
  return useQuery({
    queryKey: badgeKeys.leaderboard(),
    queryFn: async () => {
      const data = await apiClient.getBadgeLeaderboard();
      console.log('useBadgeLeaderboardQuery - fetched leaderboard:', {
        leaderboardCount: data?.length || 0,
        data
      });
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Share badge mutation
export const useShareBadgeMutation = () => {
  return useMutation({
    mutationFn: (data: { badgeId: string; platform: string; message?: string }) =>
      apiClient.shareBadge(data),
    onSuccess: (_, variables) => {
      toast.success(`Badge shared on ${variables.platform}!`);
    },
    onError: () => {
      toast.error('Failed to share badge');
    },
  });
};

// Export all hooks as a single object for easier importing
export const useBadgeQueries = () => {
  return {
    useBadgesQuery,
    useBadgeLeaderboardQuery,
    useShareBadgeMutation,
  };
};