/**
 * Metric Card Component
 * Display key metrics with trend indicators and visual elements
 */

import React from 'react';
import { cn } from '../../../utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/40',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'text-gray-600 dark:text-gray-400',
    iconBg: 'bg-gray-100 dark:bg-gray-700',
  },
};

const sizeClasses = {
  sm: {
    container: 'p-4',
    icon: 'w-8 h-8 p-1.5',
    iconSize: 'w-5 h-5',
    value: 'text-xl',
    title: 'text-sm',
    subtitle: 'text-xs',
  },
  md: {
    container: 'p-6',
    icon: 'w-10 h-10 p-2',
    iconSize: 'w-6 h-6',
    value: 'text-2xl',
    title: 'text-sm',
    subtitle: 'text-xs',
  },
  lg: {
    container: 'p-8',
    icon: 'w-12 h-12 p-2.5',
    iconSize: 'w-7 h-7',
    value: 'text-3xl',
    title: 'text-base',
    subtitle: 'text-sm',
  },
};

const TrendIndicator: React.FC<{ trend: NonNullable<MetricCardProps['trend']> }> = ({ trend }) => {
  const isPositive = trend.isPositive ?? trend.value > 0;
  const TrendIcon = isPositive ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
    </svg>
  );

  return (
    <div className={cn(
      'flex items-center space-x-1 text-xs font-medium',
      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    )}>
      {TrendIcon}
      <span>{Math.abs(trend.value)}%</span>
      {trend.label && <span className="text-gray-500 dark:text-gray-400">{trend.label}</span>}
    </div>
  );
};

const MetricCardSkeleton: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => (
  <div className={cn('animate-pulse', sizeClasses[size].container)}>
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      <div className={cn('bg-gray-200 dark:bg-gray-700 rounded-lg', sizeClasses[size].icon)}></div>
    </div>
  </div>
);

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'gray',
  size = 'md',
  className,
  loading = false,
  onClick,
}) => {
  const colorClass = colorClasses[color];
  const sizeClass = sizeClasses[size];

  if (loading) {
    return (
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border',
        colorClass.border,
        className
      )}>
        <MetricCardSkeleton size={size} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200',
        colorClass.border,
        onClick && 'cursor-pointer hover:shadow-md hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      <div className={sizeClass.container}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn(
              'font-medium text-gray-600 dark:text-gray-300',
              sizeClass.title
            )}>
              {title}
            </p>
            <p className={cn(
              'font-bold text-gray-900 dark:text-white mt-1',
              sizeClass.value
            )}>
              {value}
            </p>
            {subtitle && (
              <p className={cn(
                'text-gray-500 dark:text-gray-400 mt-1',
                sizeClass.subtitle
              )}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="mt-2">
                <TrendIndicator trend={trend} />
              </div>
            )}
          </div>
          
          {icon && (
            <div className={cn(
              'rounded-lg flex items-center justify-center flex-shrink-0',
              colorClass.iconBg,
              sizeClass.icon
            )}>
              <div className={cn(colorClass.icon, sizeClass.iconSize)}>
                {icon}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
export { MetricCard };