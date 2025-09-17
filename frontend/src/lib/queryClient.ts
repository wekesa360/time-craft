/**
 * React Query client configuration
 * Centralized configuration for API state management
 */

import { QueryClient } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Utility function to safely extract error message
export const getErrorMessage = (error: any, fallback: string = 'An error occurred'): string => {
  // First try to get a string message
  if (error?.response?.data?.message && typeof error.response.data.message === 'string') {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error && typeof error.response.data.error === 'string') {
    return error.response.data.error;
  }
  
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }
  
  // Handle structured error objects
  if (error?.response?.data) {
    const errorData = error.response.data;
    
    // Handle validation errors with issues array
    if (errorData.issues && Array.isArray(errorData.issues)) {
      return errorData.issues.length > 0 ? errorData.issues.join(', ') : fallback;
    }
    
    // Handle other object structures
    if (typeof errorData === 'object' && errorData !== null) {
      // Try to extract meaningful message from object
      if (errorData.name && typeof errorData.name === 'string') {
        return errorData.name;
      }
      
      // Last resort: stringify the object (but limit length)
      const stringified = JSON.stringify(errorData);
      if (stringified.length < 200) {
        return stringified;
      }
    }
  }
  
  return fallback;
};

// Default query options
const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache time: 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry failed requests 3 times
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus
    refetchOnWindowFocus: false,
    // Refetch on reconnect
    refetchOnReconnect: true,
    // Global error handler for queries
    onError: (error: any) => {
      const status = error?.response?.status;
      const url = error?.config?.url || error?.response?.config?.url || '';
      
      console.error('Query error:', { url, status, error });
      
      // Don't show toast errors for non-critical endpoints that commonly fail
      const nonCriticalEndpoints = [
        '/api/tasks/stats',
        '/api/tasks/matrix', 
        '/api/focus/analytics',
        '/api/social/feed',
        '/api/localization/languages'
      ];
      
      const isNonCritical = nonCriticalEndpoints.some(endpoint => url.includes(endpoint));
      
      if (isNonCritical && (status === 404 || status === 500 || status === 400)) {
        // Just log the error, don't show toast for non-critical endpoints
        console.warn(`Non-critical endpoint failed: ${url} (${status}) - silently ignoring`);
        return;
      }
      
      // Show user-friendly messages for critical errors based on status codes
      if (status === 401) {
        toast.error('Session expired - please log in again');
      } else if (status === 403) {
        toast.error('Access denied');
      } else if (status === 404) {
        // For 404s on critical endpoints, show a user-friendly message
        const isCriticalEndpoint = !nonCriticalEndpoints.some(endpoint => url.includes(endpoint));
        if (isCriticalEndpoint) {
          toast.error('The requested feature is currently unavailable');
        }
      } else if (status === 500) {
        toast.error('Server error - please try again later');
      } else if (status === 502 || status === 503 || status === 504) {
        toast.error('Service temporarily unavailable - please try again');
      } else if (status === 429) {
        toast.error('Too many requests - please wait a moment');
      } else if (status >= 400 && status < 500) {
        const message = getErrorMessage(error, 'Invalid request');
        toast.error(message);
      } else {
        const message = getErrorMessage(error, 'Network error - please check your connection');
        toast.error(message);
      }
    },
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
    // Global error handler for mutations
    onError: (error: any) => {
      const status = error?.response?.status;
      
      // Provide specific error messages for mutations
      if (status === 401) {
        toast.error('Session expired - please log in again');
      } else if (status === 403) {
        toast.error('You don\'t have permission to perform this action');
      } else if (status === 422 || status === 400) {
        // Handle validation errors with detailed feedback
        const message = getErrorMessage(error, 'Please check your input and try again');
        toast.error(message);
      } else if (status === 500) {
        toast.error('Server error - please try again');
      } else {
        const message = getErrorMessage(error, 'An error occurred');
        toast.error(message);
      }
    },
  },
};

// Create the query client
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth queries
  auth: {
    user: () => ['auth', 'user'] as const,
    profile: () => ['auth', 'profile'] as const,
  },
  
  // Task queries
  tasks: {
    all: () => ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all(), 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    search: (query: string) => [...queryKeys.tasks.all(), 'search', query] as const,
  },
  
  // Health queries
  health: {
    all: () => ['health'] as const,
    metrics: () => [...queryKeys.health.all(), 'metrics'] as const,
    metric: (type: string) => [...queryKeys.health.metrics(), type] as const,
    goals: () => [...queryKeys.health.all(), 'goals'] as const,
    goal: (id: string) => [...queryKeys.health.goals(), id] as const,
    insights: () => [...queryKeys.health.all(), 'insights'] as const,
  },
  
  // Focus queries
  focus: {
    all: () => ['focus'] as const,
    sessions: () => [...queryKeys.focus.all(), 'sessions'] as const,
    session: (id: string) => [...queryKeys.focus.sessions(), id] as const,
    active: () => [...queryKeys.focus.all(), 'active'] as const,
    stats: () => [...queryKeys.focus.all(), 'stats'] as const,
  },
  
  // Calendar queries
  calendar: {
    all: () => ['calendar'] as const,
    events: () => [...queryKeys.calendar.all(), 'events'] as const,
    event: (id: string) => [...queryKeys.calendar.events(), id] as const,
    range: (start: string, end: string) => [...queryKeys.calendar.events(), 'range', start, end] as const,
  },
  
  // Badge queries
  badges: {
    all: () => ['badges'] as const,
    earned: () => [...queryKeys.badges.all(), 'earned'] as const,
    available: () => [...queryKeys.badges.all(), 'available'] as const,
    progress: () => [...queryKeys.badges.all(), 'progress'] as const,
  },
  
  // Analytics queries
  analytics: {
    all: () => ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all(), 'dashboard'] as const,
    reports: () => [...queryKeys.analytics.all(), 'reports'] as const,
    report: (type: string, period: string) => [...queryKeys.analytics.reports(), type, period] as const,
  },
  
  // Localization queries
  localization: {
    all: () => ['localization'] as const,
    languages: () => [...queryKeys.localization.all(), 'languages'] as const,
    content: (language: string) => [...queryKeys.localization.all(), 'content', language] as const,
  },
  
  // Settings queries
  settings: {
    all: () => ['settings'] as const,
    user: () => [...queryKeys.settings.all(), 'user'] as const,
    preferences: () => [...queryKeys.settings.all(), 'preferences'] as const,
    notifications: () => [...queryKeys.settings.all(), 'notifications'] as const,
  },
} as const;

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific domain
  invalidateQueries: (queryKey: readonly unknown[]) => {
    return queryClient.invalidateQueries({ queryKey });
  },
  
  // Remove specific query from cache
  removeQueries: (queryKey: readonly unknown[]) => {
    return queryClient.removeQueries({ queryKey });
  },
  
  // Set query data manually
  setQueryData: <T>(queryKey: readonly unknown[], data: T) => {
    return queryClient.setQueryData(queryKey, data);
  },
  
  // Get query data from cache
  getQueryData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData(queryKey);
  },
  
  // Prefetch query
  prefetchQuery: (queryKey: readonly unknown[], queryFn: () => Promise<any>) => {
    return queryClient.prefetchQuery({ queryKey, queryFn });
  },
  
  // Clear all cache
  clear: () => {
    return queryClient.clear();
  },
  
  // Get cache stats
  getStats: () => {
    const cache = queryClient.getQueryCache();
    return {
      queryCount: cache.getAll().length,
      queries: cache.getAll().map(query => ({
        queryKey: query.queryKey,
        state: query.state.status,
        dataUpdatedAt: query.state.dataUpdatedAt,
        errorUpdatedAt: query.state.errorUpdatedAt,
      })),
    };
  },
};

// Development tools
if (process.env.NODE_ENV === 'development') {
  // Add query client to window for debugging
  (window as any).queryClient = queryClient;
  (window as any).queryKeys = queryKeys;
  (window as any).cacheUtils = cacheUtils;
}