/**
 * Tests for authentication API hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCurrentUser, useLogin } from '../useAuthQueries';
import { useAuthStore } from '../../../stores/auth';

// Mock the API client
vi.mock('../../../lib/api', () => ({
  apiClient: {
    getProfile: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn(),
    refreshTokens: vi.fn(),
  },
}));

// Mock the auth store
vi.mock('../../../stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAuthQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCurrentUser', () => {
    it('should not fetch user data when not authenticated', () => {
      (useAuthStore as any).mockReturnValue({
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch user data when authenticated', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      (useAuthStore as any).mockReturnValue({
        isAuthenticated: true,
      });

      const { apiClient } = await import('../../../lib/api');
      (apiClient.getProfile as any).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUser);
    });
  });

  describe('useLogin', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
      };

      const mockSetUser = vi.fn();
      const mockSetTokens = vi.fn();

      (useAuthStore as any).mockReturnValue({
        setUser: mockSetUser,
        setTokens: mockSetTokens,
      });

      const { apiClient } = await import('../../../lib/api');
      (apiClient.login as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      const loginCredentials = {
        email: 'test@example.com',
        password: 'password',
      };

      result.current.mutate(loginCredentials);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSetUser).toHaveBeenCalledWith(mockResponse.user);
      expect(mockSetTokens).toHaveBeenCalledWith(mockResponse.tokens);
    });
  });
});