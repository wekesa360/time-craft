// React Query hooks for authentication
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import type { User, LoginForm, RegisterForm } from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  validation: () => [...authKeys.all, 'validation'] as const,
};

// User profile query
export const useProfileQuery = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => apiClient.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Token validation query
export const useTokenValidationQuery = () => {
  const { tokens } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.validation(),
    queryFn: () => apiClient.validateToken(),
    enabled: !!tokens?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false, // Don't retry failed token validation
  });
};

// Login mutation
export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const { setUser, setTokens, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginForm) => apiClient.login(credentials),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (response) => {
      setUser(response.user);
      setTokens(response.tokens);
      setLoading(false);
      
      // Cache user profile
      queryClient.setQueryData(authKeys.profile(), response.user);
      
      toast.success(`Welcome back, ${response.user.firstName}!`);
    },
    onError: (error: any) => {
      setLoading(false);
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
    },
  });
};

// Register mutation
export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const { setUser, setTokens, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterForm) => apiClient.register(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (response) => {
      setUser(response.user);
      setTokens(response.tokens);
      setLoading(false);
      
      // Cache user profile
      queryClient.setQueryData(authKeys.profile(), response.user);
      
      toast.success(`Welcome to TimeCraft, ${response.user.firstName}!`);
    },
    onError: (error: any) => {
      setLoading(false);
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
    },
  });
};

// Logout mutation
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const { setUser, setTokens, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      setUser(null);
      setTokens(null);
      setLoading(false);
      
      // Clear all cached data
      queryClient.clear();
      
      toast.success('Logged out successfully');
    },
    onError: (error: any) => {
      setLoading(false);
      // Even if logout fails on server, clear local state
      setUser(null);
      setTokens(null);
      queryClient.clear();
      
      console.error('Logout error:', error);
      toast.success('Logged out successfully');
    },
  });
};

// Update profile mutation
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const { setUser, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<User>) => apiClient.updateProfile(data),
    onMutate: async (newData) => {
      setLoading(true);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: authKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(authKeys.profile());

      // Optimistically update
      queryClient.setQueryData(authKeys.profile(), (old: User) => ({
        ...old,
        ...newData,
        updatedAt: Date.now(),
      }));

      return { previousProfile };
    },
    onError: (err, newData, context) => {
      setLoading(false);
      
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(authKeys.profile(), context.previousProfile);
      }
      
      toast.error('Failed to update profile');
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setLoading(false);
      
      toast.success('Profile updated successfully');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
};

// Forgot password mutation
export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: (email: string) => apiClient.forgotPassword(email),
    onSuccess: () => {
      toast.success('Password reset email sent. Please check your inbox.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to send reset email';
      toast.error(message);
    },
  });
};

// Reset password mutation
export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      apiClient.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully. Please log in with your new password.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to reset password';
      toast.error(message);
    },
  });
};