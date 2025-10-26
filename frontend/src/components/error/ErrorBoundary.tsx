/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { errorTracking } from '../../services/errorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);
    
    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Report error to tracking service
    errorTracking.captureError(error, {
      category: 'react',
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
    });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full bg-white dark:bg-muted rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-error-light0">
              <AlertTriangle className="w-full h-full" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            
            <p className="text-foreground-secondary mb-6">
              We're sorry, but something unexpected happened. Don't worry, it's not your fault.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-background-secondary hover:bg-background-tertiary text-foreground rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
              
              <button
                onClick={this.handleRefresh}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-background-secondary hover:bg-background-tertiary text-foreground rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Page</span>
              </button>
            </div>

            {this.props.showDetails && this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-foreground-secondary hover:text-foreground mb-2 flex items-center space-x-2">
                  <Bug className="w-4 h-4" />
                  <span>Technical Details</span>
                </summary>
                <div className="bg-background-tertiary rounded-lg p-4 text-xs font-mono overflow-auto max-h-40">
                  <p className="text-error dark:text-error-light mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap text-foreground-secondary">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// React Query Error Boundary
interface QueryErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({
  children,
  onError,
}) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        onError?.(error);
        console.error('Query error:', error, errorInfo);
      }}
      fallback={
        <div className="p-4 bg-error-light dark:bg-error/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-error dark:text-error-light" />
            <h3 className="text-sm font-medium text-error dark:text-error-light">
              Failed to load data
            </h3>
          </div>
          <p className="mt-1 text-sm text-error dark:text-error-light">
            There was an error loading the requested data. Please try refreshing the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

// Async Error Boundary for React 18+ features
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
}

export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  fallback,
  onError,
}) => {
  return (
    <ErrorBoundary
      onError={(error) => {
        onError?.(error);
      }}
      fallback={fallback}
    >
      <React.Suspense fallback={fallback}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
};