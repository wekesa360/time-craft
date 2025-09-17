// Authentication store with Zustand for React Native
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/api';
import { biometricAuth, type BiometricCapabilities } from '../lib/biometric-auth';
import type { User, AuthTokens, LoginForm, RegisterForm, AuthState } from '../types';

interface AuthStore extends AuthState {
  // Biometric state
  biometricCapabilities: BiometricCapabilities | null;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  
  // Actions
  login: (credentials: LoginForm) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  
  // Biometric actions
  initializeBiometric: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  checkBiometricReauth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      
      // Biometric state
      biometricCapabilities: null,
      biometricEnabled: false,
      biometricAvailable: false,

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
          
          await apiClient.setTokens(response.tokens);
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
          
          await apiClient.setTokens(response.tokens);
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
          await apiClient.clearTokens();
        }
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) return;

        try {
          const newTokens = await apiClient.refreshTokens(tokens.refreshToken);
          set({ tokens: newTokens });
          await apiClient.setTokens(newTokens);
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
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

      loginWithBiometric: async () => {
        try {
          set({ isLoading: true });
          
          const isEnabled = await biometricAuth.isBiometricEnabled();
          if (!isEnabled) {
            throw new Error('Biometric authentication is not enabled');
          }

          const result = await biometricAuth.authenticate({
            promptMessage: 'Use biometric authentication to sign in',
          });

          if (result.success) {
            await biometricAuth.setLastBiometricAuth();
            // User is already authenticated, just update the timestamp
            set({ isLoading: false });
          } else {
            set({ isLoading: false });
            throw new Error('Biometric authentication failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      initializeBiometric: async () => {
        try {
          const capabilities = await biometricAuth.getCapabilities();
          const isEnabled = await biometricAuth.isBiometricEnabled();
          
          set({
            biometricCapabilities: capabilities,
            biometricEnabled: isEnabled,
            biometricAvailable: capabilities.isAvailable,
          });
        } catch (error) {
          console.error('Failed to initialize biometric auth:', error);
          set({
            biometricCapabilities: null,
            biometricEnabled: false,
            biometricAvailable: false,
          });
        }
      },

      setBiometricEnabled: async (enabled: boolean) => {
        try {
          set({ isLoading: true });
          await biometricAuth.setBiometricEnabled(enabled);
          set({ 
            biometricEnabled: enabled,
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkBiometricReauth: async () => {
        const isEnabled = get().biometricEnabled;
        const isAvailable = get().biometricAvailable;
        
        if (!isEnabled || !isAvailable) return false;
        
        return await biometricAuth.isReauthRequired();
      },

      initialize: async () => {
        try {
          set({ isLoading: true });
          const { tokens } = get();
          
          // Initialize biometric capabilities
          await get().initializeBiometric();
          
          if (tokens?.accessToken) {
            // Validate the token
            const validation = await apiClient.validateToken();
            if (validation.valid) {
              // Get fresh user data
              const user = await apiClient.getProfile();
              set({ user, isAuthenticated: true });
            } else {
              // Token is invalid, clear auth state
              get().logout();
            }
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize auth after rehydration
        if (state) {
          state.initialize();
        }
      },
    }
  )
);