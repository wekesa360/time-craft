/**
 * Authentication API hooks using React Query
 * Handles user authentication, profile management, and session state
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/api';
import { queryKeys, cacheUtils } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth';
import type { User, AuthTokens, LoginForm, RegisterForm } from '../../types';

// API functions
const authApi = {
  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.getProfile();
    return response;
  },

  // Login
  login: async (credentials: LoginForm): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await apiClient.login(credentials);
    return response;
  },

  // Register
  register: async (data: RegisterForm): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await apiClient.register(data);
    return response;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.logout();
  },

  // Update profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.updateProfile(data);
    return response;
  },

  // Refresh tokens
  refreshTokens: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await apiClient.refreshTokens(refreshToken);
    return response;
  },
};

// Hooks

/**
 * Get current user query
 */
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Login mutation
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Update auth store
      setUser(data.user);
      setTokens(data.tokens);
      
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
      
      toast.success('Welcome back!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });
};

/**
 * Register mutation
 */
export const useRegister = () => {
  const queryClient = useQueryClient();
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      // Update auth store
      setUser(data.user);
      setTokens(data.tokens);
      
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
      
      toast.success('Account created successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });
};

/**
 * Logout mutation
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear auth store
      setUser(null);
      setTokens(null);
      
      // Clear all cached data
      queryClient.clear();
      
      toast.success('Logged out successfully');
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local state
      setUser(null);
      setTokens(null);
      queryClient.clear();
      
      const message = error?.response?.data?.message || 'Logout failed';
      toast.error(message);
    },
  });
};

/**
 * Update profile mutation
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      // Update user data in cache and store
      queryClient.setQueryData(queryKeys.auth.user(), updatedUser);
      setUser(updatedUser);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    },
  });
};

/**
 * Refresh tokens mutation
 */
export const useRefreshTokens = () => {
  const { setTokens } = useAuthStore();

  return useMutation({
    mutationFn: authApi.refreshTokens,
    onSuccess: (newTokens) => {
      setTokens(newTokens);
    },
    onError: (error: any) => {
      // If refresh fails, logout user
      const { setUser, setTokens } = useAuthStore.getState();
      setUser(null);
      setTokens(null);
      
      const message = error?.response?.data?.message || 'Session expired';
      toast.error(message);
    },
  });
};

// Utility hooks

/**
 * Check if user is authenticated and has valid session
 */
export const useAuthStatus = () => {
  const { isAuthenticated } = useAuthStore();
  const { data: user, isLoading, error } = useCurrentUser();

  return {
    isAuthenticated: isAuthenticated && !!user,
    user,
    isLoading,
    error,
  };
};

/**
 * Prefetch user data (useful for optimistic updates)
 */
export const usePrefetchUser = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.auth.user(),
      queryFn: authApi.getCurrentUser,
      staleTime: 5 * 60 * 1000,
    });
  };
};