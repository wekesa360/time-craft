/**
 * Skeleton Loading Components
 * Provides consistent skeleton screens for better perceived performance
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      role="status"
      aria-label="Loading..."
    >
      {children}
    </div>
  );
};

// Card skeleton for dashboard cards
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-6 border rounded-lg bg-white dark:bg-gray-800', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
};

// List item skeleton
export const ListItemSkeleton: React.FC<{ showAvatar?: boolean; className?: string }> = ({ 
  showAvatar = false, 
  className 
}) => {
  return (
    <div className={cn('flex items-center space-x-3 p-3', className)}>
      {showAvatar && (
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      )}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
};

// Table row skeleton
export const TableRowSkeleton: React.FC<{ columns: number; className?: string }> = ({ 
  columns, 
  className 
}) => {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
};

// Chart skeleton
export const ChartSkeleton: React.FC<{ height?: number; className?: string }> = ({ 
  height = 200, 
  className 
}) => {
  return (
    <div className={cn('p-4', className)}>
      <div className="flex items-end justify-between space-x-2" style={{ height }}>
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton
            key={index}
            className="flex-1"
            style={{
              height: `${Math.random() * 60 + 40}%`,
              minHeight: '20px'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Avatar skeleton
export const AvatarSkeleton: React.FC<{ 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
  );
};

// Text skeleton with multiple lines
export const TextSkeleton: React.FC<{ 
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

// Button skeleton
export const ButtonSkeleton: React.FC<{
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ variant = 'primary', size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-8 px-3',
    md: 'h-10 px-4',
    lg: 'h-12 px-6'
  };

  return (
    <Skeleton className={cn('rounded-md', sizeClasses[size], className)} />
  );
};

// Image skeleton
export const ImageSkeleton: React.FC<{
  aspectRatio?: 'square' | 'video' | 'photo' | 'banner';
  className?: string;
}> = ({ aspectRatio = 'photo', className }) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    photo: 'aspect-[4/3]',
    banner: 'aspect-[3/1]'
  };

  return (
    <Skeleton className={cn('w-full', aspectClasses[aspectRatio], className)} />
  );
};

// Form field skeleton
export const FormFieldSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
};

// Navigation skeleton
export const NavSkeleton: React.FC<{ items?: number; className?: string }> = ({ 
  items = 5, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
};

// Stats skeleton for dashboard metrics
export const StatsSkeleton: React.FC<{ items?: number; className?: string }> = ({ 
  items = 4, 
  className 
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
};

// Calendar skeleton
export const CalendarSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
};