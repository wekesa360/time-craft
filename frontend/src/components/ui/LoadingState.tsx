/**
 * Loading State Components
 * Centralized loading indicators and states
 */

import React from 'react';
import { cn } from '../../lib/utils';

// Basic spinner component
export const Spinner: React.FC<{ 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Dots loading indicator
export const LoadingDots: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  return (
    <div className={cn('flex space-x-1', className)} role="status" aria-label="Loading...">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-primary-600 rounded-full animate-pulse',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Pulse loading bar
export const LoadingBar: React.FC<{
  progress?: number;
  className?: string;
  animated?: boolean;
}> = ({ progress, className, animated = true }) => {
  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
      <div
        className={cn(
          'h-2 bg-primary-600 rounded-full transition-all duration-300',
          animated && 'animate-pulse'
        )}
        style={{ width: progress ? `${progress}%` : '30%' }}
        role="progressbar"
        aria-valuenow={progress || 0}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

// Full page loading overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  children?: React.ReactNode;
}> = ({ isVisible, message = 'Loading...', children }) => {
  if (!isVisible) return <>{children}</>;

  return (
    <div className="relative">
      {children && (
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      )}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Inline loading state
export const InlineLoader: React.FC<{
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ message = 'Loading...', size = 'md', className }) => {
  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <Spinner size={size} />
      <span className="text-gray-600 dark:text-gray-300">{message}</span>
    </div>
  );
};

// Button loading state
export const LoadingButton: React.FC<{
  isLoading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  isLoading, 
  disabled, 
  children, 
  onClick, 
  className,
  variant = 'primary',
  size = 'md'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {isLoading && (
        <Spinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
};

// Card loading state
export const LoadingCard: React.FC<{
  title?: string;
  message?: string;
  className?: string;
}> = ({ 
  title = 'Loading', 
  message = 'Please wait while we load your data...', 
  className 
}) => {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 border rounded-lg p-8 text-center',
      className
    )}>
      <Spinner size="lg" className="mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        {message}
      </p>
    </div>
  );
};

// List loading state
export const LoadingList: React.FC<{
  items?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ items = 5, showAvatar = false, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 animate-pulse">
          {showAvatar && (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-3 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Empty state with loading option
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}> = ({ title, description, icon, action, isLoading = false, className }) => {
  if (isLoading) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

// Shimmer effect for custom loading states
export const Shimmer: React.FC<{
  width?: string | number;
  height?: string | number;
  className?: string;
}> = ({ width = '100%', height = '1rem', className }) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded',
        'bg-[length:200%_100%] animate-shimmer',
        className
      )}
      style={{ width, height }}
    />
  );
};