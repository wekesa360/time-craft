/**
 * Performance Monitoring Utilities
 * Track and analyze application performance metrics
 */

import React from 'react';

// Performance Metrics Interface
export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  
  // Loading Metrics
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  
  // Custom Metrics
  TTI?: number; // Time to Interactive
  TBT?: number; // Total Blocking Time
  
  // User Experience
  navigationStart?: number;
  loadComplete?: number;
  
  // Memory
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

// Performance Observer for Core Web Vitals
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private onMetricCallback?: (name: string, value: number) => void;

  constructor(onMetric?: (name: string, value: number) => void) {
    this.onMetricCallback = onMetric;
    this.initializeObservers();
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          if (lastEntry) {
            this.metrics.LCP = lastEntry.startTime;
            this.reportMetric('LCP', lastEntry.startTime);
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as any;
            if (fidEntry.processingStart && fidEntry.startTime) {
              const fid = fidEntry.processingStart - fidEntry.startTime;
              this.metrics.FID = fid;
              this.reportMetric('FID', fid);
            }
          }
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const clsEntry = entry as any;
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value;
            }
          }
          
          this.metrics.CLS = clsValue;
          this.reportMetric('CLS', clsValue);
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // Navigation and Resource Timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const navEntry = entry as PerformanceNavigationTiming;
            
            this.metrics.FCP = navEntry.responseStart - navEntry.navigationStart;
            this.metrics.TTFB = navEntry.responseStart - navEntry.requestStart;
            this.metrics.navigationStart = navEntry.navigationStart;
            this.metrics.loadComplete = navEntry.loadEventEnd - navEntry.navigationStart;
            
            this.reportMetric('FCP', this.metrics.FCP);
            this.reportMetric('TTFB', this.metrics.TTFB);
            this.reportMetric('LoadComplete', this.metrics.loadComplete);
          }
        });
        
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation observer not supported');
      }
    }

    // Memory Usage (if supported)
    this.measureMemoryUsage();
    
    // Set up periodic memory monitoring
    setInterval(() => {
      this.measureMemoryUsage();
    }, 30000); // Every 30 seconds
  }

  private measureMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.usedJSHeapSize = memory.usedJSHeapSize;
      this.metrics.totalJSHeapSize = memory.totalJSHeapSize;
      this.metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      
      this.reportMetric('MemoryUsage', memory.usedJSHeapSize / 1024 / 1024); // MB
    }
  }

  private reportMetric(name: string, value: number) {
    this.onMetricCallback?.(name, value);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} = ${Math.round(value * 100) / 100}${
        name === 'MemoryUsage' ? 'MB' : 'ms'
      }`);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public destroy() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        console.warn('Error disconnecting performance observer:', e);
      }
    });
    this.observers = [];
  }
}

// Component Performance Profiler
interface ProfilerData {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

export const createProfilerCallback = (componentName: string) => {
  return (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    const data: ProfilerData = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    };

    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && actualDuration > 16) {
      console.warn(`Slow render detected in ${componentName}:`, data);
    }

    // Report to analytics in production
    if (process.env.NODE_ENV === 'production' && actualDuration > 100) {
      // Send to your analytics service
      reportSlowRender(componentName, data);
    }
  };
};

// Bundle Analysis and Code Splitting Metrics
export const measureBundleLoad = (bundleName: string) => {
  const startTime = performance.now();
  
  return () => {
    const loadTime = performance.now() - startTime;
    console.log(`Bundle ${bundleName} loaded in ${Math.round(loadTime)}ms`);
    
    // Report bundle load times
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics
      reportBundleLoad(bundleName, loadTime);
    }
  };
};

// Route Change Performance
export const measureRouteChange = (from: string, to: string) => {
  const startTime = performance.now();
  
  return () => {
    const changeTime = performance.now() - startTime;
    console.log(`Route change ${from} → ${to} took ${Math.round(changeTime)}ms`);
    
    // Report route change times
    if (process.env.NODE_ENV === 'production') {
      reportRouteChange(from, to, changeTime);
    }
  };
};

// API Performance Monitoring
export const measureApiCall = (endpoint: string) => {
  const startTime = performance.now();
  
  return {
    success: () => {
      const duration = performance.now() - startTime;
      reportApiMetric(endpoint, duration, 'success');
    },
    error: (error: Error) => {
      const duration = performance.now() - startTime;
      reportApiMetric(endpoint, duration, 'error', error.message);
    }
  };
};

// User Interaction Performance
export const measureUserInteraction = (interaction: string) => {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    
    // Report slow interactions
    if (duration > 100) {
      console.warn(`Slow ${interaction} interaction: ${Math.round(duration)}ms`);
      
      if (process.env.NODE_ENV === 'production') {
        reportInteractionMetric(interaction, duration);
      }
    }
  };
};

// Analytics Reporting Functions (mock implementations)
const reportSlowRender = (componentName: string, data: ProfilerData) => {
  // In production, send to your analytics service
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'slow_render', {
      component_name: componentName,
      duration: data.actualDuration,
      phase: data.phase,
    });
  }
};

const reportBundleLoad = (bundleName: string, loadTime: number) => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'bundle_load', {
      bundle_name: bundleName,
      load_time: loadTime,
    });
  }
};

const reportRouteChange = (from: string, to: string, changeTime: number) => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'route_change', {
      from_route: from,
      to_route: to,
      change_time: changeTime,
    });
  }
};

const reportApiMetric = (endpoint: string, duration: number, status: string, error?: string) => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'api_call', {
      endpoint,
      duration,
      status,
      error,
    });
  }
};

const reportInteractionMetric = (interaction: string, duration: number) => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'slow_interaction', {
      interaction_type: interaction,
      duration,
    });
  }
};

// Initialize Performance Monitoring
export const initializePerformanceMonitoring = () => {
  if (typeof window === 'undefined') return null;
  
  return new PerformanceMonitor((name, value) => {
    // Report Core Web Vitals to analytics
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', name.toLowerCase(), {
        value: Math.round(value),
        custom_parameter: true,
      });
    }
  });
};

// Performance Hook for React Components
export const usePerformanceMonitoring = (componentName: string) => {
  const monitor = React.useRef<PerformanceMonitor | null>(null);
  
  React.useEffect(() => {
    monitor.current = new PerformanceMonitor();
    
    return () => {
      monitor.current?.destroy();
    };
  }, []);
  
  const measureRender = React.useCallback(() => {
    return createProfilerCallback(componentName);
  }, [componentName]);
  
  const measureInteraction = React.useCallback((interactionName: string) => {
    return measureUserInteraction(`${componentName}.${interactionName}`);
  }, [componentName]);
  
  return {
    measureRender,
    measureInteraction,
    getMetrics: () => monitor.current?.getMetrics() || {},
  };
};