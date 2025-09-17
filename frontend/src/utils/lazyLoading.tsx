/**
 * Lazy Loading Utilities
 * Provides route-based code splitting and loading states
 */

import React, { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Loading spinner component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">{message}</p>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={resetErrorBoundary}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  </div>
);

// Higher-order component for lazy loading with error boundary
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  loadingMessage?: string
) => {
  const LazyComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
        <Component {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));

  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  
  return LazyComponent;
};

// Utility function to create lazy-loaded components
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  loadingMessage?: string
) => {
  const LazyComponent = React.lazy(importFn);
  return withLazyLoading(LazyComponent, loadingMessage);
};

// Preload function for route prefetching
export const preloadRoute = (importFn: () => Promise<any>) => {
  // Preload the component
  importFn().catch(() => {
    // Silently fail if preload fails
  });
};

// Hook for route preloading on hover/focus
export const useRoutePreloader = () => {
  const preloadOnHover = (importFn: () => Promise<any>) => ({
    onMouseEnter: () => preloadRoute(importFn),
    onFocus: () => preloadRoute(importFn),
  });

  return { preloadOnHover };
};

// Component for skeleton loading states
export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
  showAvatar?: boolean;
}> = ({ lines = 3, className = '', showAvatar = false }) => (
  <div className={`animate-pulse ${className}`}>
    {showAvatar && (
      <div className="flex items-center space-x-4 mb-4">
        <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-10 w-10"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    )}
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  </div>
);

// Page-specific loading components
export const DashboardLoader = () => (
  <div className="p-6 space-y-6">
    <SkeletonLoader lines={2} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <SkeletonLoader lines={3} />
        </div>
      ))}
    </div>
  </div>
);

export const TasksLoader = () => (
  <div className="p-6 space-y-4">
    <SkeletonLoader lines={1} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <SkeletonLoader lines={2} showAvatar />
        </div>
      ))}
    </div>
  </div>
);

export const HealthLoader = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <SkeletonLoader lines={2} />
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <SkeletonLoader lines={4} />
    </div>
  </div>
);

// Route-specific loading messages
export const routeLoadingMessages = {
  dashboard: 'Loading dashboard...',
  tasks: 'Loading tasks...',
  health: 'Loading health data...',
  calendar: 'Loading calendar...',
  focus: 'Loading focus sessions...',
  badges: 'Loading badges...',
  social: 'Loading social features...',
  voice: 'Loading voice features...',
  notifications: 'Loading notifications...',
  student: 'Loading student features...',
  analytics: 'Loading analytics...',
  settings: 'Loading settings...',
  localization: 'Loading localization...',
  admin: 'Loading admin dashboard...',
};