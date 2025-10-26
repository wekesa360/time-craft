/**
 * Loading Wrapper Component
 * Intelligent loading wrapper that shows appropriate loading states
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { LoadingOverlay, LoadingCard, EmptyState, Spinner } from './LoadingState';
import { DashboardSkeleton } from '../skeletons/DashboardSkeleton';
import { TaskListSkeleton } from '../skeletons/TaskListSkeleton';
import { SettingsSkeleton } from '../skeletons/SettingsSkeleton';

export interface LoadingWrapperProps {
  isLoading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  loadingType?: 'overlay' | 'card' | 'skeleton' | 'inline' | 'minimal';
  skeletonType?: 'dashboard' | 'tasks' | 'settings' | 'generic';
  loadingMessage?: string;
  className?: string;
  children: React.ReactNode;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  error,
  isEmpty = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There\'s nothing to show here yet.',
  emptyAction,
  loadingType = 'skeleton',
  skeletonType = 'generic',
  loadingMessage = 'Loading...',
  className,
  children
}) => {
  // Show error state
  if (error && !isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-error-light0">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-muted-foreground dark:text-muted-foreground mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (isEmpty && !isLoading && !error) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
        icon={
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-3.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H6"
            />
          </svg>
        }
      />
    );
  }

  // Show loading state
  if (isLoading) {
    switch (loadingType) {
      case 'overlay':
        return (
          <LoadingOverlay isVisible={true} message={loadingMessage}>
            {children}
          </LoadingOverlay>
        );

      case 'card':
        return (
          <LoadingCard
            title="Loading"
            message={loadingMessage}
            className={className}
          />
        );

      case 'skeleton':
        return (
          <div className={className}>
            {skeletonType === 'dashboard' && <DashboardSkeleton />}
            {skeletonType === 'tasks' && <TaskListSkeleton />}
            {skeletonType === 'settings' && <SettingsSkeleton />}
            {skeletonType === 'generic' && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'minimal':
        return (
          <div className={cn('flex items-center justify-center py-2', className)}>
            <Spinner size="sm" />
          </div>
        );

      case 'inline':
      default:
        return (
          <div className={cn('flex items-center justify-center py-4', className)}>
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-muted-foreground dark:text-muted-foreground">
                {loadingMessage}
              </span>
            </div>
          </div>
        );
    }
  }

  // Show content
  return <div className={className}>{children}</div>;
};

// Specialized loading wrappers for common patterns

export const DataTableWrapper: React.FC<{
  isLoading: boolean;
  error?: string | null;
  data?: any[];
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
}> = ({
  isLoading,
  error,
  data = [],
  emptyMessage = 'No items found',
  children,
  className
}) => {
  return (
    <LoadingWrapper
      isLoading={isLoading}
      error={error}
      isEmpty={data.length === 0}
      emptyTitle={emptyMessage}
      emptyDescription="Try adjusting your filters or search criteria."
      loadingType="skeleton"
      skeletonType="generic"
      className={className}
    >
      {children}
    </LoadingWrapper>
  );
};

export const PageWrapper: React.FC<{
  isLoading: boolean;
  error?: string | null;
  skeletonType?: 'dashboard' | 'tasks' | 'settings';
  children: React.ReactNode;
  className?: string;
}> = ({
  isLoading,
  error,
  skeletonType = 'dashboard',
  children,
  className
}) => {
  return (
    <LoadingWrapper
      isLoading={isLoading}
      error={error}
      loadingType="skeleton"
      skeletonType={skeletonType}
      className={className}
    >
      {children}
    </LoadingWrapper>
  );
};

export const FormWrapper: React.FC<{
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}> = ({
  isLoading,
  error,
  children,
  className
}) => {
  return (
    <LoadingWrapper
      isLoading={isLoading}
      error={error}
      loadingType="overlay"
      loadingMessage="Processing..."
      className={className}
    >
      {children}
    </LoadingWrapper>
  );
};

export const ListWrapper: React.FC<{
  isLoading: boolean;
  error?: string | null;
  items?: any[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({
  isLoading,
  error,
  items = [],
  emptyTitle = 'No items yet',
  emptyDescription = 'Create your first item to get started.',
  emptyAction,
  children,
  className
}) => {
  return (
    <LoadingWrapper
      isLoading={isLoading}
      error={error}
      isEmpty={items.length === 0}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
      loadingType="skeleton"
      className={className}
    >
      {children}
    </LoadingWrapper>
  );
};