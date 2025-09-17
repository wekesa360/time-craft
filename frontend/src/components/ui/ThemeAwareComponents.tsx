import React from 'react';
import { useThemeStore } from '../../stores/theme';

// Theme-aware loading spinner
export function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Theme-aware progress bar
export function ProgressBar({ 
  value, 
  max = 100, 
  className = '',
  showLabel = false,
  color = 'primary'
}: { 
  value: number; 
  max?: number; 
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-secondary mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-surface-elevated rounded-full h-2 border border-default">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

// Theme-aware badge/chip component
export function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const variantClasses = {
    default: 'bg-surface-elevated text-secondary border border-default',
    primary: 'bg-primary-100 text-primary-700 border border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700',
    success: 'bg-success-light text-success border border-success',
    warning: 'bg-warning-light text-warning border border-warning',
    error: 'bg-error-light text-error border border-error',
    outline: 'bg-transparent text-secondary border border-default',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Theme-aware alert component
export function Alert({ 
  children, 
  variant = 'info',
  className = '',
  onClose
}: { 
  children: React.ReactNode; 
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
  onClose?: () => void;
}) {
  const variantClasses = {
    info: 'bg-info-light text-info border-info',
    success: 'bg-success-light text-success border-success',
    warning: 'bg-warning-light text-warning border-warning',
    error: 'bg-error-light text-error border-error',
  };

  return (
    <div
      className={`
        p-4 rounded-lg border-l-4 relative
        ${variantClasses[variant]}
        ${className}
      `}
      role="alert"
    >
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
          aria-label="Close alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// Theme-aware skeleton loader
export function Skeleton({ 
  className = '',
  width,
  height,
  rounded = true
}: { 
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        animate-pulse bg-surface-elevated
        ${rounded ? 'rounded' : ''}
        ${className}
      `}
      style={style}
    />
  );
}

// Theme-aware divider
export function Divider({ 
  orientation = 'horizontal',
  className = '',
  label
}: { 
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}) {
  if (orientation === 'vertical') {
    return (
      <div
        className={`w-px bg-border-light ${className}`}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  if (label) {
    return (
      <div className={`relative ${className}`} role="separator">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-default" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <hr
      className={`border-0 border-t border-default ${className}`}
      role="separator"
    />
  );
}

// Theme context hook for custom components
export function useTheme() {
  const { config, effectiveTheme, getColorThemeConfig } = useThemeStore();
  
  return {
    mode: config.mode,
    colorTheme: config.colorTheme,
    effectiveTheme,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light',
    colors: getColorThemeConfig(),
  };
}