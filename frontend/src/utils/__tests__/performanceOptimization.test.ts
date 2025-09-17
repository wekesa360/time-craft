import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  memoWithComparison,
  shallowEqual,
  deepEqual,
  memoizeComputation,
  createDebouncedFunction,
  createThrottledFunction,
  PerformanceMonitor,
  withPerformanceMonitoring,
  getMemoryUsage,
  performanceMonitor
} from '../performanceOptimization';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global.performance, 'now', {
  value: mockPerformanceNow,
  writable: true
});

describe('Performance Optimization Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor.clear();
    mockPerformanceNow.mockReturnValue(0);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('memoWithComparison', () => {
    it('should memoize component with custom comparison', () => {
      const TestComponent = vi.fn(({ value }: { value: number }) => (
        React.createElement('div', null, value)
      ));

      const MemoizedComponent = memoWithComparison(
        TestComponent,
        (prev, next) => prev.value === next.value
      );

      const { rerender } = render(React.createElement(MemoizedComponent, { value: 1 }));
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // Same value - should not re-render
      rerender(React.createElement(MemoizedComponent, { value: 1 }));
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // Different value - should re-render
      rerender(React.createElement(MemoizedComponent, { value: 2 }));
      expect(TestComponent).toHaveBeenCalledTimes(2);
    });

    it('should set display name correctly', () => {
      const TestComponent = () => React.createElement('div');
      TestComponent.displayName = 'TestComponent';

      const MemoizedComponent = memoWithComparison(TestComponent);
      expect(MemoizedComponent.displayName).toBe('Memo(TestComponent)');
    });
  });

  describe('shallowEqual', () => {
    it('should return true for shallow equal objects', () => {
      const obj1 = { a: 1, b: 'test' };
      const obj2 = { a: 1, b: 'test' };
      expect(shallowEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for shallow different objects', () => {
      const obj1 = { a: 1, b: 'test' };
      const obj2 = { a: 1, b: 'different' };
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it('should return false for different number of keys', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1, b: 'test' };
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it('should return false for nested object differences', () => {
      const obj1 = { a: { nested: 1 } };
      const obj2 = { a: { nested: 1 } };
      expect(shallowEqual(obj1, obj2)).toBe(false); // Different object references
    });
  });

  describe('deepEqual', () => {
    it('should return true for deeply equal objects', () => {
      const obj1 = { a: { nested: 1 }, b: [1, 2, 3] };
      const obj2 = { a: { nested: 1 }, b: [1, 2, 3] };
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for deeply different objects', () => {
      const obj1 = { a: { nested: 1 }, b: [1, 2, 3] };
      const obj2 = { a: { nested: 2 }, b: [1, 2, 3] };
      expect(deepEqual(obj1, obj2)).toBe(false);
    });
  });

  describe('memoizeComputation', () => {
    it('should cache computation results', () => {
      const expensiveFunction = vi.fn((x: number) => x * 2);
      const memoized = memoizeComputation(expensiveFunction);

      const result1 = memoized(5);
      const result2 = memoized(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(expensiveFunction).toHaveBeenCalledTimes(1);
    });

    it('should use custom key generator', () => {
      const expensiveFunction = vi.fn((obj: { id: number; name: string }) => obj.id * 2);
      const memoized = memoizeComputation(
        expensiveFunction,
        (obj) => `${obj.id}`
      );

      const result1 = memoized({ id: 5, name: 'test1' });
      const result2 = memoized({ id: 5, name: 'test2' }); // Different name, same id

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(expensiveFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('createDebouncedFunction', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = createDebouncedFunction(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('createThrottledFunction', () => {
    it('should throttle function calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttledFn = createThrottledFunction(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('PerformanceMonitor', () => {
    it('should track timing metrics', () => {
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100);

      const monitor = PerformanceMonitor.getInstance();
      const endTiming = monitor.startTiming('test-operation');
      endTiming();

      const metrics = monitor.getMetrics('test-operation');
      expect(metrics).toEqual({
        avg: 100,
        min: 100,
        max: 100,
        count: 1
      });
    });

    it('should calculate average metrics correctly', () => {
      mockPerformanceNow
        .mockReturnValueOnce(0).mockReturnValueOnce(100)
        .mockReturnValueOnce(0).mockReturnValueOnce(200)
        .mockReturnValueOnce(0).mockReturnValueOnce(300);

      const monitor = PerformanceMonitor.getInstance();
      
      let endTiming = monitor.startTiming('test-operation');
      endTiming();
      
      endTiming = monitor.startTiming('test-operation');
      endTiming();
      
      endTiming = monitor.startTiming('test-operation');
      endTiming();

      const metrics = monitor.getMetrics('test-operation');
      expect(metrics).toEqual({
        avg: 200,
        min: 100,
        max: 300,
        count: 3
      });
    });

    it('should return null for non-existent metrics', () => {
      const monitor = PerformanceMonitor.getInstance();
      const metrics = monitor.getMetrics('non-existent');
      expect(metrics).toBeNull();
    });

    it('should clear specific metrics', () => {
      mockPerformanceNow
        .mockReturnValueOnce(0).mockReturnValueOnce(100);

      const monitor = PerformanceMonitor.getInstance();
      const endTiming = monitor.startTiming('test-operation');
      endTiming();

      expect(monitor.getMetrics('test-operation')).not.toBeNull();
      
      monitor.clear('test-operation');
      expect(monitor.getMetrics('test-operation')).toBeNull();
    });

    it('should clear all metrics', () => {
      mockPerformanceNow
        .mockReturnValueOnce(0).mockReturnValueOnce(100)
        .mockReturnValueOnce(0).mockReturnValueOnce(200);

      const monitor = PerformanceMonitor.getInstance();
      
      let endTiming = monitor.startTiming('operation1');
      endTiming();
      
      endTiming = monitor.startTiming('operation2');
      endTiming();

      expect(monitor.getMetrics('operation1')).not.toBeNull();
      expect(monitor.getMetrics('operation2')).not.toBeNull();
      
      monitor.clear();
      expect(monitor.getMetrics('operation1')).toBeNull();
      expect(monitor.getMetrics('operation2')).toBeNull();
    });

    it('should get all metrics', () => {
      mockPerformanceNow
        .mockReturnValueOnce(0).mockReturnValueOnce(100)
        .mockReturnValueOnce(0).mockReturnValueOnce(200);

      const monitor = PerformanceMonitor.getInstance();
      
      let endTiming = monitor.startTiming('operation1');
      endTiming();
      
      endTiming = monitor.startTiming('operation2');
      endTiming();

      const allMetrics = monitor.getAllMetrics();
      expect(allMetrics).toHaveProperty('operation1');
      expect(allMetrics).toHaveProperty('operation2');
      expect(allMetrics.operation1.avg).toBe(100);
      expect(allMetrics.operation2.avg).toBe(200);
    });
  });

  describe('withPerformanceMonitoring', () => {
    it('should monitor component render performance', () => {
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(50);

      const TestComponent = ({ value }: { value: number }) => (
        React.createElement('div', null, value)
      );
      TestComponent.displayName = 'TestComponent';

      const MonitoredComponent = withPerformanceMonitoring(TestComponent);
      
      render(React.createElement(MonitoredComponent, { value: 1 }));

      const metrics = performanceMonitor.getMetrics('render-TestComponent');
      expect(metrics).toEqual({
        avg: 50,
        min: 50,
        max: 50,
        count: 1
      });
    });

    it('should set correct display name', () => {
      const TestComponent = () => React.createElement('div');
      TestComponent.displayName = 'TestComponent';

      const MonitoredComponent = withPerformanceMonitoring(TestComponent);
      expect(MonitoredComponent.displayName).toBe('withPerformanceMonitoring(TestComponent)');
    });

    it('should handle components without display name', () => {
      const TestComponent = () => React.createElement('div');

      const MonitoredComponent = withPerformanceMonitoring(TestComponent, 'CustomLabel');
      expect(MonitoredComponent.displayName).toBe('withPerformanceMonitoring(CustomLabel)');
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage when available', () => {
      // Mock performance.memory
      Object.defineProperty(global.performance, 'memory', {
        value: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000
        },
        configurable: true
      });

      const memory = getMemoryUsage();
      expect(memory).toEqual({
        used: 1000000,
        total: 2000000,
        percentage: 50
      });
    });

    it('should return null when memory API is not available', () => {
      // Remove memory property
      Object.defineProperty(global.performance, 'memory', {
        value: undefined,
        configurable: true
      });

      const memory = getMemoryUsage();
      expect(memory).toBeNull();
    });
  });
});

describe('Integration Tests', () => {
  it('should work together for comprehensive optimization', () => {
    mockPerformanceNow
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(25);

    // Create a component with expensive computation
    const expensiveComputation = memoizeComputation((x: number) => {
      // Simulate expensive operation
      return x * x * x;
    });

    const TestComponent = ({ value }: { value: number }) => {
      const result = expensiveComputation(value);
      return React.createElement('div', null, result);
    };

    // Apply all optimizations
    const OptimizedComponent = withPerformanceMonitoring(
      memoWithComparison(TestComponent, shallowEqual),
      'OptimizedTestComponent'
    );

    const { rerender } = render(React.createElement(OptimizedComponent, { value: 5 }));
    
    // Should render with computed value
    expect(screen.getByText('125')).toBeInTheDocument();

    // Re-render with same props - should be memoized
    rerender(React.createElement(OptimizedComponent, { value: 5 }));
    
    // Check performance metrics
    const metrics = performanceMonitor.getMetrics('render-OptimizedTestComponent');
    expect(metrics?.count).toBe(1); // Should only render once due to memoization
  });
});