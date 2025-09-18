/**
 * Error Tracking Service
 * Centralized error reporting and monitoring
 */

import React from 'react';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  userAgent?: string;
  timestamp?: number;
  url?: string;
  [key: string]: any;
}

interface ErrorReport {
  message: string;
  stack?: string;
  name: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'promise' | 'react' | 'unknown';
}

class ErrorTrackingService {
  private isEnabled: boolean;
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 50;
  private flushInterval: number | null = null;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.sessionId = this.generateSessionId();
    this.initializeErrorHandlers();
    this.startFlushInterval();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        category: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          category: 'promise',
          reason: event.reason,
        }
      );
    });

    // React error boundary integration
    this.setupReactErrorBoundary();
  }

  private setupReactErrorBoundary(): void {
    // This will be called by React error boundaries
    (window as any).__errorTracking = {
      captureError: (error: Error, context: ErrorContext) => {
        this.captureError(error, { ...context, category: 'react' });
      },
    };
  }

  private startFlushInterval(): void {
    if (!this.isEnabled) return;

    this.flushInterval = window.setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public captureError(error: Error, context: Partial<ErrorContext> = {}): void {
    if (!this.isEnabled) {
      console.error('Error captured (not sent in development):', error, context);
      return;
    }

    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: {
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
      severity: this.determineSeverity(error, context),
      category: context.category || 'unknown',
    };

    this.addToQueue(errorReport);
  }

  public captureMessage(message: string, context: Partial<ErrorContext> = {}): void {
    const error = new Error(message);
    this.captureError(error, context);
  }

  public captureBreadcrumb(message: string, category: string, data?: any): void {
    // Breadcrumbs for debugging user actions
    console.log(`[Breadcrumb] ${category}: ${message}`, data);
  }

  private determineSeverity(error: Error, context: Partial<ErrorContext>): 'low' | 'medium' | 'high' | 'critical' {
    // Determine severity based on error type and context
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'medium'; // Chunk loading errors are usually recoverable
    }

    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'medium'; // Network errors are usually temporary
    }

    if (error.name === 'TypeError' && error.message.includes('Cannot read property')) {
      return 'high'; // Type errors often indicate bugs
    }

    if (error.name === 'ReferenceError') {
      return 'high'; // Reference errors indicate bugs
    }

    if (context.category === 'react') {
      return 'high'; // React errors are usually critical for UX
    }

    if (error.message.includes('Critical') || error.message.includes('Fatal')) {
      return 'critical';
    }

    return 'medium';
  }

  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);

    // If queue is full, remove oldest items
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Flush immediately for critical errors
    if (errorReport.severity === 'critical') {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await this.sendErrors(errorsToSend);
    } catch (error) {
      console.error('Failed to send error reports:', error);
      // Re-add errors to queue if sending failed
      this.errorQueue.unshift(...errorsToSend);
    }
  }

  private async sendErrors(errors: ErrorReport[]): Promise<void> {
    // In a real implementation, you would send to your error monitoring service
    // For now, we'll just log them
    console.group('Error Reports');
    errors.forEach((error, index) => {
      console.log(`Error ${index + 1}:`, {
        message: error.message,
        severity: error.severity,
        category: error.category,
        context: error.context,
      });
    });
    console.groupEnd();

    // Example: Send to external service
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ errors }),
    // });
  }

  public async flushImmediate(): Promise<void> {
    await this.flush();
  }

  public getErrorStats(): { total: number; bySeverity: Record<string, number>; byCategory: Record<string, number> } {
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.errorQueue.forEach((error) => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
    });

    return {
      total: this.errorQueue.length,
      bySeverity,
      byCategory,
    };
  }

  public clearQueue(): void {
    this.errorQueue = [];
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushImmediate();
  }
}

// Create singleton instance
export const errorTracking = new ErrorTrackingService();

// React hook for error tracking
export const useErrorTracking = () => {
  const captureError = (error: Error, context?: Partial<ErrorContext>) => {
    errorTracking.captureError(error, context);
  };

  const captureMessage = (message: string, context?: Partial<ErrorContext>) => {
    errorTracking.captureMessage(message, context);
  };

  const captureBreadcrumb = (message: string, category: string, data?: any) => {
    errorTracking.captureBreadcrumb(message, category, data);
  };

  return {
    captureError,
    captureMessage,
    captureBreadcrumb,
  };
};

// Higher-order component for automatic error tracking
export const withErrorTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => {
    const { captureBreadcrumb } = useErrorTracking();

    React.useEffect(() => {
      captureBreadcrumb(`Component mounted: ${componentName || Component.name}`, 'component');
      
      return () => {
        captureBreadcrumb(`Component unmounted: ${componentName || Component.name}`, 'component');
      };
    }, [captureBreadcrumb]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withErrorTracking(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Performance monitoring integration
export const performanceTracking = {
  measure: (name: string, fn: () => void) => {
    const start = performance.now();
    try {
      fn();
    } catch (error) {
      errorTracking.captureError(error as Error, {
        category: 'performance',
        operation: name,
      });
      throw error;
    } finally {
      const duration = performance.now() - start;
      errorTracking.captureBreadcrumb(`Performance: ${name}`, 'performance', { duration });
    }
  },

  measureAsync: async (name: string, fn: () => Promise<any>) => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      errorTracking.captureBreadcrumb(`Performance: ${name}`, 'performance', { duration });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      errorTracking.captureError(error as Error, {
        category: 'performance',
        operation: name,
        duration,
      });
      throw error;
    }
  },
};

export default errorTracking;
