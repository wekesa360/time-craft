import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, State> {
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
    console.error(`RouteErrorBoundary caught an error in ${this.props.routeName || 'unknown route'}:`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);
    
    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, you would send this to your error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // errorMonitoring.captureException(error, { 
      //   extra: errorInfo,
      //   tags: { route: this.props.routeName },
      //   context: { route: this.props.routeName }
      // });
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <RouteErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        routeName={this.props.routeName}
        showDetails={this.props.showDetails}
        onRetry={this.handleRetry}
        onGoBack={this.handleGoBack}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

interface RouteErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  routeName?: string;
  showDetails?: boolean;
  onRetry: () => void;
  onGoBack: () => void;
  onGoHome: () => void;
}

const RouteErrorFallback: React.FC<RouteErrorFallbackProps> = ({
  error,
  errorInfo,
  routeName,
  showDetails,
  onRetry,
  onGoBack,
  onGoHome,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-red-500">
          <AlertTriangle className="w-full h-full" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          An unexpected error occurred while loading this page.
        </p>

        {routeName && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Route: {routeName}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={onRetry}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={onGoBack}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={onGoHome}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </button>
        </div>

        {showDetails && error && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2">
              Technical Details
            </summary>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-xs font-mono overflow-auto max-h-40">
              <p className="text-red-600 dark:text-red-400 mb-2">
                {error.name}: {error.message}
              </p>
              {error.stack && (
                <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

// Hook for error boundary context
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Higher-order component for wrapping routes with error boundaries
export const withRouteErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  routeName?: string
) => {
  const WrappedComponent = (props: P) => (
    <RouteErrorBoundary routeName={routeName}>
      <Component {...props} />
    </RouteErrorBoundary>
  );

  WrappedComponent.displayName = `withRouteErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Specialized error boundaries for different types of content
export const DataErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, fallback, onError }) => {
  return (
    <RouteErrorBoundary
      onError={(error) => onError?.(error)}
      fallback={
        fallback || (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Data Error
              </h3>
            </div>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              There was an error loading data for this page.
            </p>
          </div>
        )
      }
    >
      {children}
    </RouteErrorBoundary>
  );
};

export const FormErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, fallback, onError }) => {
  return (
    <RouteErrorBoundary
      onError={(error) => onError?.(error)}
      fallback={
        fallback || (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Form Error
              </h3>
            </div>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              There was an error with the form. Please check your input and try again.
            </p>
          </div>
        )
      }
    >
      {children}
    </RouteErrorBoundary>
  );
};

export const ChartErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, fallback, onError }) => {
  return (
    <RouteErrorBoundary
      onError={(error) => onError?.(error)}
      fallback={
        fallback || (
          <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
              <AlertTriangle className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Chart Error
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There was an error loading the chart data.
            </p>
          </div>
        )
      }
    >
      {children}
    </RouteErrorBoundary>
  );
};
