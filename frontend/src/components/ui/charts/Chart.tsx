/**
 * Base Chart Component
 * Reusable chart wrapper with consistent styling and responsive behavior
 */

import React from 'react';
import { cn } from '../../../utils/cn';

interface ChartProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number | string;
  loading?: boolean;
  error?: string;
  actions?: React.ReactNode;
}

const ChartSkeleton: React.FC<{ height: number | string }> = ({ height }) => (
  <div className="animate-pulse" style={{ height }}>
    <div className="h-full bg-muted dark:bg-muted rounded"></div>
  </div>
);

const ChartError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-full text-center">
    <div>
      <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-muted-foreground dark:text-muted-foreground">{message}</p>
    </div>
  </div>
);

export const Chart: React.FC<ChartProps> = ({
  children,
  title,
  subtitle,
  className,
  height = 300,
  loading = false,
  error,
  actions,
}) => {
  return (
    <div className={cn('bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-foreground dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Chart Content */}
      <div style={{ height }} className="relative">
        {loading ? (
          <ChartSkeleton height={height} />
        ) : error ? (
          <ChartError message={error} />
        ) : (
          children
        )}
      </div>
    </div>
  );
};