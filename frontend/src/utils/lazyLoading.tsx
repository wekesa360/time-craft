import React, { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';
import { ErrorBoundary } from '../components/error/ErrorBoundary';
import { bundleAnalyzer } from './bundleAnalyzer';

// Loading component for better UX
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Error fallback for lazy loaded components
const LazyErrorFallback = ({ retry }: { error: Error; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-4 text-center">
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
      Failed to load component
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      There was an error loading this part of the application.
    </p>
        <button
      onClick={retry}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
  </div>
);

// Higher-order component for lazy loading with error boundary
export const withLazyLoading = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ComponentType
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: P) => (
    <ErrorBoundary
      fallback={<LazyErrorFallback error={new Error('Lazy loading failed')} retry={() => window.location.reload()} />}
    >
      <Suspense fallback={fallback ? React.createElement(fallback) : <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

// Lazy load pages with preloading
export const lazyPages = {
  Dashboard: withLazyLoading(() => import('../pages/Dashboard')),
  TasksPage: withLazyLoading(() => import('../pages/TasksPage')),
  HealthPage: withLazyLoading(() => import('../pages/HealthPage')),
  CalendarPage: withLazyLoading(() => import('../pages/CalendarPage')),
  FocusPage: withLazyLoading(() => import('../pages/FocusPage')),
  BadgesPage: withLazyLoading(() => import('../pages/BadgesPage')),
  SocialPage: withLazyLoading(() => import('../pages/SocialPage')),
  VoicePage: withLazyLoading(() => import('../pages/VoicePage')),
  NotificationsPage: withLazyLoading(() => import('../pages/NotificationsPage')),
  StudentPage: withLazyLoading(() => import('../pages/StudentPage')),
  AnalyticsPage: withLazyLoading(() => import('../pages/AnalyticsPage')),
  SettingsPage: withLazyLoading(() => import('../pages/SettingsPage')),
  LocalizationPage: withLazyLoading(() => import('../pages/LocalizationPage')),
  AdminPage: withLazyLoading(() => import('../pages/AdminPage')),
};

// Lazy load feature components
export const lazyFeatures = {
  // Analytics components
  AnalyticsDashboard: withLazyLoading(() => import('../components/features/analytics/AnalyticsDashboard')),
  
  // Admin components
  UserManagement: withLazyLoading(() => import('../components/features/admin/UserManagement')),
  SystemMetrics: withLazyLoading(() => import('../components/features/admin/SystemMetrics')),
  SecurityDashboard: withLazyLoading(() => import('../components/features/admin/SecurityDashboard')),
  
  // Health components
  HealthDashboard: withLazyLoading(() => import('../components/features/health/HealthDashboard')),
  HealthInsights: withLazyLoading(() => import('../components/features/health/HealthInsights')),
  MoodTracker: withLazyLoading(() => import('../components/features/health/MoodTracker')),
  ExerciseLogger: withLazyLoading(() => import('../components/features/health/ExerciseLogger')),
  
  // Task components
  EisenhowerMatrix: withLazyLoading(() => import('../components/features/tasks/EisenhowerMatrix')),
  TaskForm: withLazyLoading(() => import('../components/features/tasks/TaskForm')),
  TaskFilters: withLazyLoading(() => import('../components/features/tasks/TaskFilters')),
  
  // Focus components
  FocusTimer: withLazyLoading(() => import('../components/features/focus/FocusTimer')),
  FocusAnalytics: withLazyLoading(() => import('../components/features/focus/FocusAnalytics')),
  
  // Calendar components
  CalendarView: withLazyLoading(() => import('../components/features/calendar/CalendarView')),
  MeetingScheduler: withLazyLoading(() => import('../components/features/calendar/MeetingScheduler')),
  
  // Social components
  ActivityFeed: withLazyLoading(() => import('../components/features/social/ActivityFeed')),
  ConnectionsList: withLazyLoading(() => import('../components/features/social/ConnectionsList')),
  
  // Voice components
  VoiceRecorder: withLazyLoading(() => import('../components/features/voice/VoiceRecorder')),
  VoiceAnalytics: withLazyLoading(() => import('../components/features/voice/VoiceAnalytics')),
};

// Lazy load UI components
export const lazyUI = {
  // Charts
  BarChart: withLazyLoading(() => import('../components/ui/charts/BarChart')),
  LineChart: withLazyLoading(() => import('../components/ui/charts/LineChart')),
  PieChart: withLazyLoading(() => import('../components/ui/charts/PieChart')),
  ProgressRing: withLazyLoading(() => import('../components/ui/charts/ProgressRing')),
  
  // Animations
  FadeIn: withLazyLoading(() => import('../components/ui/animations/FadeIn')),
  SlideIn: withLazyLoading(() => import('../components/ui/animations/SlideIn')),
  ScaleIn: withLazyLoading(() => import('../components/ui/animations/ScaleIn')),
  
  // Layout
  ResponsiveGrid: withLazyLoading(() => import('../components/ui/layout/ResponsiveGrid')),
  ResponsiveTable: withLazyLoading(() => import('../components/ui/ResponsiveTable')),
};

// Preloading utilities
export const preloader = {
  // Preload a component
  preload: (importFn: () => Promise<any>) => {
    return importFn();
  },
  
  // Preload multiple components
  preloadMultiple: (importFns: Array<() => Promise<any>>) => {
    return Promise.all(importFns.map(fn => fn()));
  },
  
  // Preload on hover
  preloadOnHover: (element: HTMLElement, importFn: () => Promise<any>) => {
    let preloaded = false;
    
    const preload = () => {
      if (!preloaded) {
        preloaded = true;
        importFn();
      }
    };
    
    element.addEventListener('mouseenter', preload, { once: true });
    element.addEventListener('focus', preload, { once: true });
  },
  
  // Preload on intersection
  preloadOnIntersection: (element: HTMLElement, importFn: () => Promise<any>) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            importFn();
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(element);
  },
};

// Route-based code splitting
export const routeSplitting = {
  // Split routes by priority
  critical: ['Dashboard', 'TasksPage', 'HealthPage'],
  important: ['CalendarPage', 'FocusPage', 'SettingsPage'],
  optional: ['AnalyticsPage', 'AdminPage', 'SocialPage'],
  
  // Get route priority
  getPriority: (routeName: string): 'critical' | 'important' | 'optional' => {
    if (routeSplitting.critical.includes(routeName)) return 'critical';
    if (routeSplitting.important.includes(routeName)) return 'important';
    return 'optional';
  },
  
  // Preload routes based on priority
  preloadByPriority: (currentRoute: string) => {
    const priority = routeSplitting.getPriority(currentRoute);
    
    // Preload critical routes immediately
    if (priority === 'critical') {
      routeSplitting.critical.forEach(route => {
        if (route !== currentRoute) {
          // Get the import function for the route
          const routeImport = lazyPages[route as keyof typeof lazyPages];
          if (routeImport) {
            preloader.preload(() => Promise.resolve({ default: routeImport }));
          }
        }
      });
    }
    
    // Preload important routes after a delay
    if (priority === 'critical' || priority === 'important') {
      setTimeout(() => {
        routeSplitting.important.forEach(route => {
          if (route !== currentRoute) {
            // Get the import function for the route
            const routeImport = lazyPages[route as keyof typeof lazyPages];
            if (routeImport) {
              preloader.preload(() => Promise.resolve({ default: routeImport }));
            }
          }
        });
      }, 2000);
    }
  },
};

// Performance monitoring for lazy loading
export const lazyLoadingMonitor = {
  // Track loading times
  trackLoading: (componentName: string, startTime: number) => {
    const loadTime = performance.now() - startTime;
    bundleAnalyzer.trackSize(`lazy-${componentName}`, loadTime);
    
    console.log(`Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`);
  },
  
  // Track loading errors
  trackError: (componentName: string, error: Error) => {
    console.error(`Failed to lazy load ${componentName}:`, error);
    // Could send to error tracking service
  },
  
  // Get loading statistics
  getStats: () => {
    return bundleAnalyzer.getSizeHistory('lazy-*');
  },
};

// Loading messages for different routes
export const routeLoadingMessages = {
  login: 'Signing you in...',
  register: 'Creating your account...',
  dashboard: 'Loading your dashboard...',
  tasks: 'Loading your tasks...',
  health: 'Loading health data...',
  calendar: 'Loading calendar...',
  focus: 'Preparing focus session...',
  social: 'Loading social features...',
  voice: 'Initializing voice features...',
  settings: 'Loading settings...',
  analytics: 'Preparing analytics...',
  admin: 'Loading admin panel...',
};

export default {
  withLazyLoading,
  lazyPages,
  lazyFeatures,
  lazyUI,
  preloader,
  routeSplitting,
  lazyLoadingMonitor,
};