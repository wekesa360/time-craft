/**
 * API Hooks Index
 * Centralized exports for all React Query API hooks
 */

// Authentication hooks
export * from './useAuthQueries';

// Task management hooks
export * from './useTaskQueries';

// Re-export query utilities
export { queryKeys, cacheUtils, queryClient } from '../../lib/queryClient';