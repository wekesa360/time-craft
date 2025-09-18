// Authentication store with Zustand
import { create } from 'zustand';
import { apiClient } from '../lib/api';
import { createPersistedStore, persistenceConfigs } from '../lib/storePersistence';
import type { User, AuthTokens, LoginForm, RegisterForm, AuthState } from '../types';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  createPersistedStore(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: (tokens) => {
        set({ tokens });
        if (tokens) {
          apiClient.setTokens(tokens);
        } else {
          apiClient.clearTokens();
        }
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      login: async (credentials) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.login(credentials);
          
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
          });

          apiClient.setTokens(response.tokens);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.register(data);
          
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
          });

          apiClient.setTokens(response.tokens);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
          apiClient.clearTokens();
        }
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const newTokens = await apiClient.refreshTokens(tokens.refreshToken);
          set({ tokens: newTokens });
          apiClient.setTokens(newTokens);
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      updateProfile: async (data) => {
        try {
          set({ isLoading: true });
          const updatedUser = await apiClient.updateProfile(data);
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      initialize: async () => {
        const { tokens } = get();
        
        if (tokens?.accessToken) {
          try {
            set({ isLoading: true });
            const profile = await apiClient.getProfile();
            set({
              user: profile,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            console.error('Failed to initialize auth:', error);
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
            });
            apiClient.clearTokens();
          }
        }
      },
    }),
    persistenceConfigs.auth
  )
);