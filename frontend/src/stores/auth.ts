// Authentication store with Zustand
import { create } from 'zustand';

// Periodic token validation
let tokenValidationInterval: NodeJS.Timeout | null = null;

const startTokenValidation = () => {
  if (tokenValidationInterval) {
    clearInterval(tokenValidationInterval);
  }

  // Check token validity every 5 minutes
  tokenValidationInterval = setInterval(async () => {
    const { tokens, isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated && tokens?.accessToken) {
      try {
        await apiClient.ensureValidToken();
      } catch (error) {
        console.error('Periodic token validation failed:', error);
        // Token validation failed, logout user
        useAuthStore.getState().logout();
      }
    }
  }, 5 * 60 * 1000); // 5 minutes
};

const stopTokenValidation = () => {
  if (tokenValidationInterval) {
    clearInterval(tokenValidationInterval);
    tokenValidationInterval = null;
  }
};
import { apiClient } from '../lib/api';
import { createPersistedStore, persistenceConfigs } from '../lib/storePersistence';
import { localStorageCoordinator } from '../lib/localStorageCoordinator';
import type { User, AuthTokens, LoginForm, RegisterForm, AuthState } from '../types';
import i18n from '../i18n';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<{ requiresVerification: boolean; email?: string; otpId?: string; expiresAt?: number } | void>;
  verifyEmail: (email: string, otpCode: string) => Promise<void>;
  resendVerification: (email: string) => Promise<{ otpId: string; expiresAt: number }>;
  loginWithOTP: (email: string, otpCode: string) => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
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
          stopTokenValidation();
        }
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      login: async (credentials) => {
        try {
          console.log('Auth store login called with:', credentials.email);
          set({ isLoading: true });
          const response = await apiClient.login(credentials);
          console.log('Login response received:', response.user?.email);

          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
          console.log('Auth state updated in store');
          console.log('Tokens being saved:', response.tokens);

          // Wait for persist middleware to complete
          await new Promise(resolve => setTimeout(resolve, 200));

          // Verify localStorage was updated correctly
          const authData = localStorage.getItem('timecraft-auth');
          console.log('localStorage after login (persist middleware):', authData);
          
          if (localStorageCoordinator.isValueCorrupted(authData)) {
            console.warn('🚨 Auth data corruption detected after login, retrying...');
            console.log('🔍 Current auth state:', get());
            
            // Retry the persist operation
            set({
              user: response.user,
              tokens: response.tokens,
              isAuthenticated: true,
              isLoading: false,
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check again after retry
            const retryAuthData = localStorage.getItem('timecraft-auth');
            console.log('localStorage after retry:', retryAuthData);
          }

          apiClient.setTokens(response.tokens);
          // Connect to SSE after successful login
          apiClient.connectSSE();
          
          // Load user preferences from backend
          try {
            const { useThemeStore } = await import('./theme');
            const themeStore = useThemeStore.getState();
            await themeStore.loadPreferencesFromBackend();
            console.log('User preferences loaded from backend');
          } catch (error) {
            console.warn('Failed to load user preferences:', error);
          }
          
          console.log('Login completed successfully');
        } catch (error) {
          console.error('Login failed in auth store:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.register(data);

          // If verification is required, return the verification info
          if (response.requiresVerification) {
            set({ isLoading: false });
            return {
              requiresVerification: true,
              email: data.email,
              otpId: response.otpId,
              expiresAt: response.expiresAt
            };
          }

          // Otherwise, complete registration with tokens
          if (response.user && response.tokens) {
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
          });

          apiClient.setTokens(response.tokens);
          // Connect to SSE after successful registration
          apiClient.connectSSE();
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      verifyEmail: async (email, otpCode) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.verifyEmail(email, otpCode);

          if (response.user && response.tokens) {
            set({
              user: response.user,
              tokens: response.tokens,
              isAuthenticated: true,
              isLoading: false,
            });

            apiClient.setTokens(response.tokens);
            // Connect to SSE after successful verification
            apiClient.connectSSE();
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      resendVerification: async (email) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.resendVerification(email);
          set({ isLoading: false });
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      sendOTP: async (email) => {
        try {
          set({ isLoading: true });
          await apiClient.sendOTP(email);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithOTP: async (email, otpCode) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.verifyOTP(email, otpCode);

          set({
            user: response.data.user,
            tokens: {
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken
            },
            isAuthenticated: true,
            isLoading: false,
          });

          apiClient.setTokens({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken
          });
          // Connect to SSE after successful OTP login
          apiClient.connectSSE();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithGoogle: async () => {
        try {
          set({ isLoading: true });
          const { authUrl } = await apiClient.getGoogleAuthUrl();
          window.location.href = authUrl;
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
          stopTokenValidation();
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
          console.log('[Auth Store] updateProfile called with data:', data);
          set({ isLoading: true });
          console.log('[Auth Store] Calling apiClient.updateProfile...');
          const updatedUser = await apiClient.updateProfile(data);
          console.log('[Auth Store] Profile updated successfully, new user:', updatedUser);
          set({ user: updatedUser, isLoading: false });
          console.log('[Auth Store] State updated with new user');
          return updatedUser;
        } catch (error) {
          console.error('[Auth Store] updateProfile error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      forgotPassword: async (email) => {
        try {
          set({ isLoading: true });
          await apiClient.forgotPassword(email);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      resetPassword: async (token, newPassword) => {
        try {
          set({ isLoading: true });
          await apiClient.resetPassword(token, newPassword);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateLanguage: async (language: string) => {
        try {
          set({ isLoading: true });

          // Use coordinator to safely update i18next language
          await localStorageCoordinator.safeWrite('i18nextLng', language);
          
          // Update i18n language immediately (don't wait for API)
          await i18n.changeLanguage(language);

          // Only update user profile if we have valid tokens and user
          const { user, tokens } = get();
          if (user && tokens?.accessToken) {
            // Create a safe copy of the user object with proper typing
            const updatedUser: User = {
              ...user,
              preferredLanguage: language as User['preferredLanguage'],
              updatedAt: Date.now()
            };

            // Use a small delay to prevent localStorage conflicts
            await new Promise(resolve => setTimeout(resolve, 50));

            set({
              user: updatedUser,
              isLoading: false,
            });

            // Try to update language in backend, but don't fail if it doesn't work
            try {
              await apiClient.updateUserLanguage(language);
            } catch (error) {
              console.warn('Failed to update language in backend (will retry later):', error);
              // Language change still succeeds locally even if backend update fails
            }
          } else {
            // Just update loading state if no user/tokens
            set({ isLoading: false });
            console.warn('Language changed locally, but no user profile to update');
          }

        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      initialize: async () => {
        console.log('Auth store initialize called');
        const { tokens, isAuthenticated } = get();
        console.log('Current auth state:', { isAuthenticated, hasTokens: !!tokens?.accessToken });

        // If already authenticated and have tokens, validate them
        if (tokens?.accessToken) {
          try {
            console.log('Validating existing tokens...');
            set({ isLoading: true });

            // Check if auth data is corrupted before trying to validate
            if (apiClient.isAuthDataCorrupted()) {
              console.log('Corrupted auth data detected, clearing auth state');
              set({
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }

            // Check if tokens are valid by trying to get a stored token from API client
            const storedToken = apiClient.getStoredToken();
            if (!storedToken) {
              console.log('No valid token found in API client, clearing auth state');
              set({
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }

            // Ensure token is valid before making requests
            await apiClient.ensureValidToken();

            // Tokens are still valid, continue with user profile
            if (tokens?.accessToken) {
              // Restore tokens in API client from store
              if (!apiClient.restoreTokensFromStore()) {
                console.log('Failed to restore tokens from store, using current tokens');
                apiClient.setTokens(tokens);
              }

              // Fetch user profile to verify authentication
              const profile = await apiClient.getProfile();
              console.log('Profile loaded successfully:', profile?.email);

              set({
                user: profile,
                isAuthenticated: true,
                isLoading: false,
              });

              // Sync language from user profile
              if (profile.preferredLanguage && profile.preferredLanguage !== i18n.language) {
                await i18n.changeLanguage(profile.preferredLanguage);
              }

              // Connect to SSE after successful authentication
              apiClient.connectSSE();

              // Start periodic token validation
              startTokenValidation();

              console.log('Auth initialization completed successfully');
            } else {
              // Tokens were cleared during validation (expired/invalid)
              console.log('Tokens were cleared during validation');
              set({
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Auth initialization failed:', error);
            // Clear invalid tokens and user data
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
            });
            apiClient.clearTokens();
            stopTokenValidation();
          }
        } else {
          console.log('No tokens found, user not authenticated');
          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tokens: null
          });
        }
      },
    }),
    persistenceConfigs.auth
  )
);