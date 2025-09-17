/**
 * Performance optimization utilities for React components
 * Includes memoization helpers, lazy loading utilities, and performance monitoring
 */

import { ComponentType, memo, lazy, LazyExoticComponent, ReactElement } from 'react';
// Simple debounce and throttle implementations to avoid external dependencies
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Type definitions
type ComponentWithProps<P = {}> = ComponentType<P>;
type MemoizedComponent<P = {}> = ComponentType<P>;
type LazyComponent<P = {}> = LazyExoticComponent<ComponentType<P>>;

/**
 * Enhanced memo wrapper with custom comparison function
 */
export const memoWithComparison = <P extends object>(
  Component: ComponentWithProps<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): MemoizedComponent<P> => {
  const MemoizedComponent = memo(Component, areEqual);
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

/**
 * Shallow comparison function for props
 */
export const shallowEqual = <P extends object>(prevProps: P, nextProps: P): boolean => {
  const prevKeys = Object.keys(prevProps) as (keyof P)[];
  const nextKeys = Object.keys(nextProps) as (keyof P)[];

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Deep comparison function for props (use sparingly)
 */
export const deepEqual = <P extends object>(prevProps: P, nextProps: P): boolean => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
};

/**
 * Memoization for expensive computations
 */
class ComputationCache<T = any> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxAge: number;
  private maxSize: number;

  constructor(maxAge = 5 * 60 * 1000, maxSize = 100) { // 5 minutes, 100 items
    this.maxAge = maxAge;
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    const now = Date.now();
    if (now - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.value;
  }

  set(key: string, value: T): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global computation cache
const computationCache = new ComputationCache();

/**
 * Memoize expensive computations with caching
 */
export const memoizeComputation = <T>(
  fn: (...args: any[]) => T,
  keyGenerator?: (...args: any[]) => string
): ((...args: any[]) => T) => {
  return (...args: any[]): T => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    const cached = computationCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    computationCache.set(key, result);
    return result;
  };
};

/**
 * Debounced function creator for performance optimization
 */
export const createDebouncedFunction = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T => {
  return debounce(fn, delay) as T;
};

/**
 * Throttled function creator for performance optimization
 */
export const createThrottledFunction = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 100
): T => {
  return throttle(fn, delay) as T;
};

/**
 * Lazy loading with preloading capability
 */
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  preload: boolean = false
): LazyComponent<P> => {
  const LazyComponent = lazy(importFn);

  // Preload if requested
  if (preload) {
    importFn().catch(console.error);
  }

  return LazyComponent;
};

/**
 * Intersection Observer for lazy loading
 */
export class LazyLoadObserver {
  private observer: IntersectionObserver;
  private callbacks = new Map<Element, () => void>();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target);
          if (callback) {
            callback();
            this.unobserve(entry.target);
          }
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }

  observe(element: Element, callback: () => void): void {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.observer.disconnect();
    this.callbacks.clear();
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<string, number[]>();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      const measurements = this.metrics.get(label)!;
      measurements.push(duration);
      
      // Keep only last 100 measurements
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  getMetrics(label: string): { avg: number; min: number; max: number; count: number } | null {
    const measurements = this.metrics.get(label);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [label] of this.metrics) {
      const metrics = this.getMetrics(label);
      if (metrics) {
        result[label] = metrics;
      }
    }

    return result;
  }

  clear(label?: string): void {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
    }
  }
}

/**
 * HOC for performance monitoring
 */
export const withPerformanceMonitoring = <P extends object>(
  Component: ComponentType<P>,
  label?: string
): ComponentType<P> => {
  const componentLabel = label || Component.displayName || Component.name || 'Unknown';
  const monitor = PerformanceMonitor.getInstance();

  const PerformanceMonitoredComponent = (props: P) => {
    const endTiming = monitor.startTiming(`render-${componentLabel}`);
    
    try {
      const result = Component(props);
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      throw error;
    }
  };

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentLabel})`;
  return PerformanceMonitoredComponent;
};

/**
 * Bundle size optimization utilities
 */
export const preloadModule = (importFn: () => Promise<any>): void => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch(console.error);
    });
  } else {
    setTimeout(() => {
      importFn().catch(console.error);
    }, 100);
  }
};

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = (): {
  used: number;
  total: number;
  percentage: number;
} | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
  }
  return null;
};

/**
 * Component render optimization checker
 */
export const logRenderOptimization = (componentName: string, props: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 Render Optimization - ${componentName}`);
    console.log('Props:', props);
    console.log('Timestamp:', new Date().toISOString());
    
    const memory = getMemoryUsage();
    if (memory) {
      console.log(`Memory: ${(memory.used / 1024 / 1024).toFixed(2)}MB (${memory.percentage.toFixed(1)}%)`);
    }
    
    console.groupEnd();
  }
};

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const lazyLoadObserver = new LazyLoadObserver();

// Cleanup function for when the app unmounts
export const cleanup = (): void => {
  computationCache.clear();
  performanceMonitor.clear();
  lazyLoadObserver.disconnect();
};