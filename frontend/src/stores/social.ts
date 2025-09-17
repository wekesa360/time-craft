// Social features store with Zustand
import { create } from 'zustand';
import { apiClient } from '../lib/api';
import type { Connection, Challenge, ActivityFeedItem, LeaderboardEntry } from '../types';

interface SocialState {
  connections: Connection[];
  pendingRequests: Connection[];
  challenges: Challenge[];
  activityFeed: ActivityFeedItem[];
  isLoading: boolean;
  error: string | null;
}

interface SocialStore extends SocialState {
  // Actions
  fetchConnections: () => Promise<void>;
  sendConnectionRequest: (targetUserId: string, message?: string) => Promise<void>;
  acceptConnection: (id: string) => Promise<void>;
  declineConnection: (id: string) => Promise<void>;
  fetchPublicChallenges: () => Promise<void>;
  createChallenge: (challenge: Omit<Challenge, 'id' | 'createdBy' | 'participants' | 'leaderboard' | 'isActive'>) => Promise<void>;
  joinChallenge: (id: string) => Promise<void>;
  shareAchievement: (type: string, content: any, platform?: string) => Promise<void>;
  fetchActivityFeed: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateChallenge: (challenge: Challenge) => void;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  // Initial state
  connections: [],
  pendingRequests: [],
  challenges: [],
  activityFeed: [],
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchConnections: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.getConnections();
      set({
        connections: response.connections,
        pendingRequests: response.pendingRequests,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch connections',
        isLoading: false,
      });
    }
  },

  sendConnectionRequest: async (targetUserId, message) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.sendConnectionRequest({ targetUserId, message });
      set({ isLoading: false });
      // Optionally refetch connections to update UI
      get().fetchConnections();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send connection request',
        isLoading: false,
      });
      throw error;
    }
  },

  acceptConnection: async (id) => {
    try {
      await apiClient.acceptConnection(id);
      // Move from pending to connections
      const { pendingRequests, connections } = get();
      const acceptedRequest = pendingRequests.find(req => req.id === id);
      if (acceptedRequest) {
        set({
          connections: [...connections, { ...acceptedRequest, status: 'accepted' }],
          pendingRequests: pendingRequests.filter(req => req.id !== id),
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to accept connection',
      });
      throw error;
    }
  },

  declineConnection: async (id) => {
    try {
      await apiClient.declineConnection(id);
      // Remove from pending requests
      const { pendingRequests } = get();
      set({
        pendingRequests: pendingRequests.filter(req => req.id !== id),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to decline connection',
      });
      throw error;
    }
  },

  fetchPublicChallenges: async () => {
    try {
      set({ isLoading: true, error: null });
      const challenges = await apiClient.getPublicChallenges();
      set({ challenges, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch challenges',
        isLoading: false,
      });
    }
  },

  createChallenge: async (challengeData) => {
    try {
      set({ isLoading: true, error: null });
      const challenge = await apiClient.createChallenge(challengeData);
      const { challenges } = get();
      set({
        challenges: [...challenges, challenge],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create challenge',
        isLoading: false,
      });
      throw error;
    }
  },

  joinChallenge: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.joinChallenge(id);
      set({ isLoading: false });
      // Refetch challenges to update participation status
      get().fetchPublicChallenges();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to join challenge',
        isLoading: false,
      });
      throw error;
    }
  },

  shareAchievement: async (type, content, platform) => {
    try {
      await apiClient.shareAchievement({ type, content, platform });
      // Optionally add to activity feed
      get().fetchActivityFeed();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to share achievement',
      });
      throw error;
    }
  },

  fetchActivityFeed: async () => {
    try {
      set({ isLoading: true, error: null });
      const activityFeed = await apiClient.getActivityFeed();
      set({ activityFeed, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activity feed',
        isLoading: false,
      });
    }
  },

  updateChallenge: (challenge) => {
    const { challenges } = get();
    set({
      challenges: challenges.map(c => c.id === challenge.id ? challenge : c),
    });
  },
}));