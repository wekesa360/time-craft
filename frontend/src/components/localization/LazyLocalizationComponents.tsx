/**
 * Lazy-loaded localization components for performance optimization
 * These components are loaded only when needed to reduce initial bundle size
 */

import { lazy, Suspense, ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Lazy load heavy localization components
export const LazyLocalizationPage = lazy(() => 
  import('../../pages/LocalizationPage').then(module => ({ 
    default: module.default 
  }))
);

export const LazyCacheManagementSection = lazy(() => 
  import('../settings/CacheManagementSection').then(module => ({ 
    default: module.CacheManagementSection 
  }))
);

export const LazyLanguagePreferencesSection = lazy(() => 
  import('../settings/LanguagePreferencesSection').then(module => ({ 
    default: module.LanguagePreferencesSection 
  }))
);

// Loading fallback component
const LocalizationLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p className="text-sm text-foreground-secondary animate-pulse">
        Loading localization features...
      </p>
    </div>
  </div>
);

// Error fallback component
const LocalizationErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void; 
}) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center space-y-4">
      <div className="text-red-500 text-lg">⚠️</div>
      <h3 className="text-lg font-semibold text-foreground">
        Failed to load localization features
      </h3>
      <p className="text-sm text-foreground-secondary">
        {error.message}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="btn-primary text-sm px-4 py-2"
      >
        Try Again
      </button>
    </div>
  </div>
);

// Higher-order component for wrapping lazy components
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      FallbackComponent={LocalizationErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={fallback || <LocalizationLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Pre-configured lazy components with error boundaries
export const LocalizationPageWithSuspense = withLazyLoading(LazyLocalizationPage);
export const CacheManagementSectionWithSuspense = withLazyLoading(LazyCacheManagementSection);
export const LanguagePreferencesSectionWithSuspense = withLazyLoading(LazyLanguagePreferencesSection);

// Preload function for critical components
export const preloadLocalizationComponents = () => {
  // Preload components that are likely to be used soon
  const preloadPromises = [
    import('../../pages/LocalizationPage'),
    import('../settings/CacheManagementSection'),
    import('../settings/LanguagePreferencesSection')
  ];

  return Promise.allSettled(preloadPromises);
};

// Hook for preloading components on user interaction
export const usePreloadLocalization = () => {
  const preload = () => {
    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadLocalizationComponents();
      });
    } else {
      setTimeout(() => {
        preloadLocalizationComponents();
      }, 100);
    }
  };

  return { preload };
};