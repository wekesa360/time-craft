// Badge system store with Zustand
import { create } from 'zustand';
import { apiClient } from '../lib/api';
import type { Badge, LeaderboardEntry } from '../types';

interface BadgesState {
  badges: Badge[];
  totalBadges: number;
  unlockedBadges: number;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

interface BadgesStore extends BadgesState {
  // Actions
  fetchBadges: () => Promise<void>;
  shareBadge: (badgeId: string, platform: string, message?: string) => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  checkForNewBadges: () => Promise<Badge[]>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addBadge: (badge: Badge) => void;
}

export const useBadgesStore = create<BadgesStore>((set, get) => ({
  // Initial state
  badges: [],
  totalBadges: 0,
  unlockedBadges: 0,
  leaderboard: [],
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchBadges: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.getBadges();
      set({
        badges: response.badges,
        totalBadges: response.totalBadges,
        unlockedBadges: response.unlockedBadges,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch badges',
        isLoading: false,
      });
    }
  },

  shareBadge: async (badgeId, platform, message) => {
    try {
      await apiClient.shareBadge({ badgeId, platform, message });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to share badge',
      });
      throw error;
    }
  },

  fetchLeaderboard: async () => {
    try {
      set({ isLoading: true, error: null });
      const leaderboard = await apiClient.getBadgeLeaderboard();
      set({ leaderboard, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
        isLoading: false,
      });
    }
  },

  checkForNewBadges: async () => {
    try {
      // This would be called after completing activities
      // For now, we'll just refetch badges to check for updates
      await get().fetchBadges();
      return [];
    } catch (error) {
      console.error('Failed to check for new badges:', error);
      return [];
    }
  },

  addBadge: (badge) => {
    const { badges } = get();
    set({
      badges: [...badges, badge],
      unlockedBadges: badges.filter(b => b.isUnlocked).length + 1,
    });
  },
}));