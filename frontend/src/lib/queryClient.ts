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
  },
  mutations: {
    // Retry failed mutations once
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
    // Retry delay for mutations
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  },
};

// Create and configure the query client
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Global error handler for mutations
export const handleMutationError = (error: any, context?: string) => {
  const status = error?.response?.status;
  const url = error?.config?.url || error?.response?.config?.url || '';
  
  console.error('Mutation error:', { url, status, error, context });
  
  // Show user-friendly messages based on status codes
  if (status === 401) {
    // Unauthorized - redirect to login
    window.location.href = '/login';
  } else if (status === 403) {
    // Forbidden - show access denied message
    toast.error('You don\'t have permission to perform this action.');
  } else if (status === 404) {
    // Not found - show not found message
    toast.error('The requested resource was not found.');
  } else if (status >= 500) {
    // Server error - show server error message
    toast.error('Server error. Please try again later.');
  } else {
    // Generic error message for other cases
    const message = getErrorMessage(error, 'Something went wrong. Please try again.');
    toast.error(message);
  }
};

    // Global error handler for queries
export const handleQueryError = (error: any, context?: string) => {
      const status = error?.response?.status;
      const url = error?.config?.url || error?.response?.config?.url || '';
      
  console.error('Query error:', { url, status, error, context });
      
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
    // Unauthorized - redirect to login
    window.location.href = '/login';
      } else if (status === 403) {
    // Forbidden - show access denied message
    toast.error('You don\'t have permission to access this resource.');
      } else if (status === 404) {
    // Not found - show not found message
    toast.error('The requested resource was not found.');
  } else if (status >= 500) {
    // Server error - show server error message
    toast.error('Server error. Please try again later.');
      } else {
    // Generic error message for other cases
    const message = getErrorMessage(error, 'Something went wrong. Please try again.');
        toast.error(message);
      }
};

// Query key factory for consistent key generation
export const queryKeys = {
  // Task-related queries
  tasks: {
    all: ['tasks'] as const,
    list: (filters: any) => [...queryKeys.tasks.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
    stats: () => [...queryKeys.tasks.all, 'stats'] as const,
    matrix: () => [...queryKeys.tasks.all, 'matrix'] as const,
  },
  
  // Health-related queries
  health: {
    all: ['health'] as const,
    dashboard: () => [...queryKeys.health.all, 'dashboard'] as const,
    insights: () => [...queryKeys.health.all, 'insights'] as const,
    mood: () => [...queryKeys.health.all, 'mood'] as const,
    exercise: () => [...queryKeys.health.all, 'exercise'] as const,
  },
  
  // Focus-related queries
  focus: {
    all: ['focus'] as const,
    sessions: () => [...queryKeys.focus.all, 'sessions'] as const,
    templates: () => [...queryKeys.focus.all, 'templates'] as const,
    analytics: () => [...queryKeys.focus.all, 'analytics'] as const,
  },
  
  // Calendar-related queries
  calendar: {
    all: ['calendar'] as const,
    events: (filters: any) => [...queryKeys.calendar.all, 'events', filters] as const,
    meetings: () => [...queryKeys.calendar.all, 'meetings'] as const,
    availability: () => [...queryKeys.calendar.all, 'availability'] as const,
  },
  
  // Social-related queries
  social: {
    all: ['social'] as const,
    feed: () => [...queryKeys.social.all, 'feed'] as const,
    connections: () => [...queryKeys.social.all, 'connections'] as const,
    challenges: () => [...queryKeys.social.all, 'challenges'] as const,
  },
  
  // Voice-related queries
  voice: {
    all: ['voice'] as const,
    notes: () => [...queryKeys.voice.all, 'notes'] as const,
    analytics: () => [...queryKeys.voice.all, 'analytics'] as const,
    settings: () => [...queryKeys.voice.all, 'settings'] as const,
  },
  
  // Analytics-related queries
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    reports: () => [...queryKeys.analytics.all, 'reports'] as const,
  },
  
  // User-related queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
  },
  
  // Auth-related queries
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  
  // Localization-related queries
  localization: {
    all: ['localization'] as const,
    languages: () => [...queryKeys.localization.all, 'languages'] as const,
    translations: (lang: string) => [...queryKeys.localization.all, 'translations', lang] as const,
  },
};

// Utility functions for query invalidation
export const invalidateQueries = {
  // Invalidate all task-related queries
  tasks: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  
  // Invalidate all health-related queries
  health: () => queryClient.invalidateQueries({ queryKey: queryKeys.health.all }),
  
  // Invalidate all focus-related queries
  focus: () => queryClient.invalidateQueries({ queryKey: queryKeys.focus.all }),
  
  // Invalidate all calendar-related queries
  calendar: () => queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all }),
  
  // Invalidate all social-related queries
  social: () => queryClient.invalidateQueries({ queryKey: queryKeys.social.all }),
  
  // Invalidate all voice-related queries
  voice: () => queryClient.invalidateQueries({ queryKey: queryKeys.voice.all }),
  
  // Invalidate all analytics-related queries
  analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
  
  // Invalidate all user-related queries
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),
  
  // Invalidate all localization-related queries
  localization: () => queryClient.invalidateQueries({ queryKey: queryKeys.localization.all }),
};

// Utility functions for query prefetching
export const prefetchQueries = {
  // Prefetch task list
  tasks: async (filters: any = {}) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.list(filters),
      queryFn: async () => {
        // This would be replaced with actual API call
        return [];
      },
      staleTime: 5 * 60 * 1000,
    });
  },
  
  // Prefetch health dashboard
  healthDashboard: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.health.dashboard(),
      queryFn: async () => {
        // This would be replaced with actual API call
        return {};
      },
      staleTime: 5 * 60 * 1000,
    });
  },
  
  // Prefetch user profile
  userProfile: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.user.profile(),
      queryFn: async () => {
        // This would be replaced with actual API call
        return {};
      },
      staleTime: 10 * 60 * 1000,
    });
  },
};

// Cache utilities
export const cacheUtils = {
  // Clear all cache
  clearAll: () => queryClient.clear(),
  
  // Clear specific query
  clearQuery: (queryKey: any[]) => queryClient.removeQueries({ queryKey }),
  
  // Clear queries by pattern
  clearQueriesByPattern: (pattern: string) => {
    queryClient.getQueryCache().findAll().forEach(query => {
      if (query.queryKey.some(key => typeof key === 'string' && key.includes(pattern))) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  },
  
  // Get cache size
  getCacheSize: () => queryClient.getQueryCache().getAll().length,
  
  // Get cache info
  getCacheInfo: () => {
    const queries = queryClient.getQueryCache().getAll();
    return {
      total: queries.length,
      stale: queries.filter(q => q.isStale()).length,
      fresh: queries.filter(q => !q.isStale()).length,
      error: queries.filter(q => q.state.status === 'error').length,
    };
  },
};

export default queryClient;