// Focus sessions store with Zustand
import { create } from 'zustand';
import { apiClient } from '../lib/api';
import type { FocusSession, SessionTemplate, FocusEnvironment } from '../types';

interface FocusState {
  activeSession: FocusSession | null;
  templates: SessionTemplate[];
  sessions: FocusSession[];
  environments: FocusEnvironment[];
  analytics: any;
  isLoading: boolean;
  error: string | null;
}

interface FocusStore extends FocusState {
  // Actions
  fetchTemplates: () => Promise<void>;
  startSession: (templateKey: string, taskId?: string, environmentId?: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  completeSession: (productivityRating: number, notes?: string) => Promise<void>;
  cancelSession: () => Promise<void>;
  logDistraction: (type: string, description?: string) => Promise<void>;
  fetchSessions: (params?: any) => Promise<void>;
  fetchEnvironments: () => Promise<void>;
  createEnvironment: (environment: Omit<FocusEnvironment, 'id' | 'userId'>) => Promise<void>;
  fetchAnalytics: (period?: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFocusStore = create<FocusStore>((set, get) => ({
  // Initial state
  activeSession: null,
  templates: [],
  sessions: [],
  environments: [],
  analytics: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchTemplates: async () => {
    try {
      set({ isLoading: true, error: null });
      const templates = await apiClient.getFocusTemplates();
      set({ templates, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
        isLoading: false,
      });
    }
  },

  startSession: async (templateKey, taskId, environmentId) => {
    try {
      set({ isLoading: true, error: null });
      const session = await apiClient.startFocusSession({
        templateKey,
        taskId,
        environmentId,
      });
      set({ activeSession: session, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start session',
        isLoading: false,
      });
      throw error;
    }
  },

  pauseSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;

    try {
      const session = await apiClient.pauseFocusSession(activeSession.id);
      set({ activeSession: session });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to pause session',
      });
      throw error;
    }
  },

  resumeSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;

    try {
      const session = await apiClient.resumeFocusSession(activeSession.id);
      set({ activeSession: session });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to resume session',
      });
      throw error;
    }
  },

  completeSession: async (productivityRating, notes) => {
    const { activeSession } = get();
    if (!activeSession) return;

    try {
      set({ isLoading: true, error: null });
      const session = await apiClient.completeFocusSession(activeSession.id, {
        actual_duration: Math.floor((Date.now() - activeSession.started_at) / 1000 / 60), // Convert to minutes
        productivity_rating: productivityRating,
        notes,
      });
      
      // Update sessions list and clear active session
      const { sessions } = get();
      set({
        activeSession: null,
        sessions: sessions.map(s => s.id === session.id ? session : s),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to complete session',
        isLoading: false,
      });
      throw error;
    }
  },

  cancelSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;

    try {
      await apiClient.cancelFocusSession(activeSession.id);
      set({ activeSession: null });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to cancel session',
      });
      throw error;
    }
  },

  logDistraction: async (type, description) => {
    const { activeSession } = get();
    if (!activeSession) return;

    try {
      const distraction = await apiClient.logDistraction(activeSession.id, {
        type,
        description,
      });
      
      // Update active session with new distraction
      set({
        activeSession: {
          ...activeSession,
          distractions: [...activeSession.distractions, distraction],
        },
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to log distraction',
      });
      throw error;
    }
  },

  fetchSessions: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const sessions = await apiClient.getFocusSessions(params);
      set({ sessions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
        isLoading: false,
      });
    }
  },

  fetchEnvironments: async () => {
    try {
      set({ isLoading: true, error: null });
      const environments = await apiClient.getFocusEnvironments();
      set({ environments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch environments',
        isLoading: false,
      });
    }
  },

  createEnvironment: async (environmentData) => {
    try {
      set({ isLoading: true, error: null });
      const environment = await apiClient.createFocusEnvironment(environmentData);
      const { environments } = get();
      set({
        environments: [...environments, environment],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create environment',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchAnalytics: async (period) => {
    try {
      set({ isLoading: true, error: null });
      const analytics = await apiClient.getFocusAnalytics(period);
      set({ analytics, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
        isLoading: false,
      });
    }
  },
}));