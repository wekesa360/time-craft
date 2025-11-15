// Authentication store with Zustand for React Native
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/api';
import { biometricAuth, type BiometricCapabilities } from '../lib/biometric-auth';
import type { User, AuthTokens, LoginForm, RegisterForm, AuthState } from '../types';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.13.106:8787' // Local development - use your computer's IP
  : 'https://your-production-api.com'; // Production

interface AuthStore extends AuthState {
  // Biometric state
  biometricCapabilities: BiometricCapabilities | null;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  // Unified loading flags
  isFetching: boolean;
  isMutating: boolean;
  
  // Actions
  login: (credentials: LoginForm) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  register: (data: RegisterForm) => Promise<{ requiresVerification: boolean; email?: string; otpId?: string; expiresAt?: number } | void>;
  verifyEmail: (email: string, otpCode: string) => Promise<void>;
  resendVerification: (email: string) => Promise<{ otpId: string; expiresAt: number }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  sendOTP: (email: string) => Promise<any>;
  verifyOTP: (email: string, code: string) => Promise<any>;
  testConnection: () => Promise<void>;
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
      isFetching: false,
      isMutating: false,
      
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
        set({ isLoading, isMutating: isLoading });
      },

      login: async (credentials) => {
        try {
          set({ isLoading: true, isMutating: true });
          const response = await apiClient.login(credentials.email, credentials.password);
          
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
            isMutating: false,
          });
          
          await apiClient.setTokens(response.tokens);
        } catch (error: any) {
          set({ isLoading: false, isMutating: false });
          // Re-throw with verification info if applicable
          if (error.requiresVerification) {
            throw {
              ...error,
              requiresVerification: true,
              email: error.email
            };
          }
          throw error;
        }
      },

      loginWithGoogle: async () => {
        try {
          set({ isLoading: true, isMutating: true });
          
          // Get Google OAuth URL from backend
          const response = await fetch(`${API_BASE_URL}/auth/google`);
          if (!response.ok) {
            throw new Error('Failed to get Google OAuth URL');
          }
          
          const { authUrl } = await response.json();
          
          // For now, show an alert with instructions
          // In a full implementation, you would use:
          // - @react-native-google-signin/google-signin for native Google Sign-In
          // - Or WebBrowser.openAuthSessionAsync for web-based OAuth
          throw new Error(
            'Google Sign-In requires additional setup. Please use the web version or contact support for mobile authentication setup.'
          );
          
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, isMutating: true });
          const response = await apiClient.register({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            timezone: data.timezone,
            preferredLanguage: data.preferredLanguage,
            isStudent: data.isStudent
          });
          
          // If verification is required, return the verification info
          if (response && typeof response === 'object' && 'requiresVerification' in response && response.requiresVerification) {
            set({ isLoading: false, isMutating: false });
            return {
              requiresVerification: true,
              email: response.email || data.email,
              otpId: response.otpId,
              expiresAt: response.expiresAt
            };
          }
          
          // Otherwise, complete registration with tokens
          if (response && 'user' in response && 'tokens' in response && response.user && response.tokens) {
            set({
              user: response.user,
              tokens: response.tokens,
              isAuthenticated: true,
              isLoading: false,
              isMutating: false,
            });
            
            await apiClient.setTokens(response.tokens);
          } else {
            set({ isLoading: false, isMutating: false });
          }
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          throw error;
        }
      },

      verifyEmail: async (email, otpCode) => {
        try {
          set({ isLoading: true, isMutating: true });
          const response = await apiClient.verifyEmail(email, otpCode);
          
          if (response.user && response.tokens) {
            set({
              user: response.user,
              tokens: response.tokens,
              isAuthenticated: true,
              isLoading: false,
              isMutating: false,
            });
            
            await apiClient.setTokens(response.tokens);
          } else {
            set({ isLoading: false, isMutating: false });
          }
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          throw error;
        }
      },

      resendVerification: async (email) => {
        try {
          set({ isLoading: true, isMutating: true });
          const response = await apiClient.resendVerification(email);
          set({ isLoading: false, isMutating: false });
          return response;
        } catch (error) {
          set({ isLoading: false, isMutating: false });
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
            isMutating: false,
          });
          await apiClient.clearTokens();
        }
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) return;

        try {
          // The refresh is handled automatically by the API client interceptors
          // This method is kept for compatibility but the actual refresh
          // happens in the API client's response interceptor
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
      },

      updateProfile: async (data) => {
        try {
          set({ isLoading: true, isMutating: true });
          const updatedUser = await apiClient.updateProfile(data);
          set({ user: updatedUser, isLoading: false, isMutating: false });
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          throw error;
        }
      },

      loginWithBiometric: async () => {
        try {
          set({ isLoading: true, isMutating: true });
          
          const isEnabled = await biometricAuth.isBiometricEnabled();
          if (!isEnabled) {
            throw new Error('Biometric authentication is not enabled');
          }

          const result = await biometricAuth.authenticate({
            promptMessage: 'Use biometric authentication to sign in',
          });

          if (result.success) {
            await biometricAuth.setLastBiometricAuth();
            // Restore tokens from SecureStore and validate session
            const accessToken = (await (await import('expo-secure-store')).getItemAsync('access_token'))
              || (await (await import('expo-secure-store')).getItemAsync('accessToken'));
            const refreshToken = (await (await import('expo-secure-store')).getItemAsync('refresh_token'))
              || (await (await import('expo-secure-store')).getItemAsync('refreshToken'));

            if (!accessToken || !refreshToken) {
              set({ isLoading: false, isMutating: false });
              throw new Error('No saved session found');
            }

            const tokens = { accessToken, refreshToken } as AuthTokens;
            await apiClient.setTokens(tokens);

            try {
              const user = await apiClient.getProfile();
              set({ user, tokens, isAuthenticated: true, isLoading: false, isMutating: false });
            } catch (e) {
              // Profile fetch failed; clear session
              await apiClient.clearTokens();
              set({ user: null, tokens: null, isAuthenticated: false, isLoading: false, isMutating: false });
              throw new Error('Saved session is invalid. Please sign in again.');
            }
          } else {
            set({ isLoading: false, isMutating: false });
            throw new Error('Biometric authentication failed');
          }
        } catch (error) {
          set({ isLoading: false, isMutating: false });
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
          set({ isLoading: true, isMutating: true });
          await biometricAuth.setBiometricEnabled(enabled);
          set({ 
            biometricEnabled: enabled,
            isLoading: false,
            isMutating: false 
          });
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          throw error;
        }
      },

      checkBiometricReauth: async () => {
        const isEnabled = get().biometricEnabled;
        const isAvailable = get().biometricAvailable;
        
        if (!isEnabled || !isAvailable) return false;
        
        return await biometricAuth.isReauthRequired();
      },

      forgotPassword: async (email: string) => {
        try {
          set({ isLoading: true, isMutating: true });
          await apiClient.forgotPassword(email);
          set({ isLoading: false, isMutating: false });
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          throw error;
        }
      },

      sendOTP: async (email: string) => {
        try {
          set({ isLoading: true, isMutating: true });
          const result = await apiClient.sendOTP(email);
          set({ isLoading: false, isMutating: false });
          return result;
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          throw error;
        }
      },

      verifyOTP: async (email: string, code: string) => {
        try {
          set({ isLoading: true, isMutating: true });
          const result = await apiClient.verifyOTP(email, code);
          
          if (result.success && result.data.user && result.data.tokens) {
            set({
              user: result.data.user,
              tokens: result.data.tokens,
              isAuthenticated: true,
              isLoading: false,
              isMutating: false,
            });
          } else {
            set({ isLoading: false, isMutating: false });
          }
          
          return result;
        } catch (error) {
          set({ isLoading: false, isMutating: false });
          throw error;
        }
      },

      testConnection: async () => {
        try {
          set({ isLoading: true, isFetching: true });
          const result = await apiClient.testConnection();
          set({ isLoading: false, isFetching: false });
          
          if (!result.success) {
            throw new Error(result.error || 'Connection test failed');
          }
        } catch (error) {
          set({ isLoading: false, isFetching: false });
          throw error;
        }
      },

      initialize: async () => {
        try {
          set({ isLoading: true, isFetching: true });
          // Wire API client auth invalidation to store logout
          apiClient.setAuthInvalidHandler(() => {
            try {
              get().logout();
            } catch (_) {
              // noop
            }
          });
          const { tokens } = get();
          
          // Initialize biometric capabilities
          await get().initializeBiometric();
          
          if (tokens?.accessToken) {
            try {
              // Try to get fresh user data to validate the token
              const user = await apiClient.getProfile();
              set({ user, isAuthenticated: true });
            } catch (error) {
              // Token is invalid, clear auth state
              console.log('Token validation failed, clearing auth state');
              get().logout();
            }
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          get().logout();
        } finally {
          set({ isLoading: false, isFetching: false });
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