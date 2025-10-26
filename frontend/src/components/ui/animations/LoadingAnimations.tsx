/**
 * Loading Animations Component
 * Advanced loading states and skeleton animations
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibilityContext } from '../../accessibility/AccessibilityProvider';
import { Loader2, RefreshCw, Download, Upload, Check, X, Clock } from 'lucide-react';

// Spinner Variants
type SpinnerVariant = 'default' | 'dots' | 'bars' | 'pulse' | 'bounce' | 'wave' | 'orbit';

interface SpinnerProps {
  variant?: SpinnerVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  variant = 'default',
  size = 'md',
  color = 'text-primary-500',
  className,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  if (prefersReducedMotion) {
    return <Loader2 className={`${sizeClasses[size]} ${color} ${className}`} />;
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 bg-current rounded-full ${color}`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        );

      case 'bars':
        return (
          <div className={`flex items-end space-x-1 ${className}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className={`w-1 bg-current ${color}`}
                animate={{
                  height: ['8px', '24px', '8px'],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={`${sizeClasses[size]} ${color} rounded-full border-2 border-current ${className}`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );

      case 'bounce':
        return (
          <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 bg-current rounded-full ${color}`}
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        );

      case 'wave':
        return (
          <div className={`flex items-center space-x-1 ${className}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className={`w-1 h-8 bg-current ${color}`}
                animate={{
                  scaleY: [1, 0.3, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        );

      case 'orbit':
        return (
          <div className={`relative ${sizeClasses[size]} ${className}`}>
            <motion.div
              className={`absolute inset-0 border-2 border-current border-t-transparent rounded-full ${color}`}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className={`absolute inset-2 border-2 border-current border-r-transparent rounded-full ${color}`}
              animate={{ rotate: -360 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
        );

      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className={className}
          >
            <Loader2 className={`${sizeClasses[size]} ${color}`} />
          </motion.div>
        );
    }
  };

  return (
    <div role="status" aria-label="Loading">
      {renderSpinner()}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Progress Indicators
interface ProgressIndicatorProps {
  progress: number; // 0-100
  variant?: 'linear' | 'circular' | 'semi-circular';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  color?: string;
  className?: string;
  animated?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  variant = 'linear',
  size = 'md',
  showPercentage = true,
  color = 'text-primary-500',
  className,
  animated = true,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const sizeClasses = {
    sm: { width: 80, height: 80, strokeWidth: 4 },
    md: { width: 120, height: 120, strokeWidth: 6 },
    lg: { width: 160, height: 160, strokeWidth: 8 },
  };

  if (variant === 'circular' || variant === 'semi-circular') {
    const { width, height, strokeWidth } = sizeClasses[size];
    const radius = (width - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = variant === 'semi-circular' ? circumference / 2 : circumference;
    const strokeDashoffset = strokeDasharray - (clampedProgress / 100) * strokeDasharray;

    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <svg
          width={width}
          height={height}
          className="transform -rotate-90"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-background-secondary"
            strokeDasharray={variant === 'semi-circular' ? `${strokeDasharray}, ${circumference}` : undefined}
          />
          {/* Progress circle */}
          <motion.circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className={color}
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: strokeDasharray }}
            animate={{ 
              strokeDashoffset: prefersReducedMotion ? strokeDashoffset : strokeDashoffset 
            }}
            transition={{
              duration: prefersReducedMotion ? 0 : 1,
              ease: "easeOut",
            }}
            strokeLinecap="round"
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-semibold ${color}`}>
              {Math.round(clampedProgress)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // Linear progress bar
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-foreground-secondary mb-1">
        <span>Progress</span>
        {showPercentage && <span>{Math.round(clampedProgress)}%</span>}
      </div>
      <div className="w-full bg-background-secondary rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full bg-current ${color} relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: prefersReducedMotion ? 0 : 1,
            ease: "easeOut",
          }}
        >
          {animated && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Loading States
interface LoadingStateProps {
  state: 'loading' | 'success' | 'error' | 'idle';
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  state,
  message,
  className,
  size = 'md',
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const getIcon = () => {
    switch (state) {
      case 'loading':
        return <Spinner size={size} />;
      case 'success':
        return (
          <motion.div
            initial={prefersReducedMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Check className={`${sizeClasses[size]} text-success`} />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={prefersReducedMotion ? {} : { scale: 0 }}
            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
            transition={{ 
              scale: { type: "spring", stiffness: 200, damping: 20 },
              rotate: { duration: 0.5, ease: "easeOut" }
            }}
          >
            <X className={`${sizeClasses[size]} text-error-light0`} />
          </motion.div>
        );
      default:
        return <Clock className={`${sizeClasses[size]} text-foreground-secondary`} />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getIcon()}
      {message && (
        <motion.span
          initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm text-foreground-secondary"
        >
          {message}
        </motion.span>
      )}
    </div>
  );
};

// Skeleton Loader with Animation
interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'wave';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  animated?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  className,
  animated = true,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();

  const baseClasses = `bg-background-secondary ${animated && !prefersReducedMotion ? 'animate-pulse' : ''}`;

  const getSkeletonElement = (index?: number) => {
    const style: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    };

    switch (variant) {
      case 'text':
        return (
          <div
            key={index}
            className={`${baseClasses} rounded h-4 ${className}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width || '100%',
            }}
          />
        );
      case 'circular':
        return (
          <div
            key={index}
            className={`${baseClasses} rounded-full ${className}`}
            style={{
              ...style,
              width: style.width || '40px',
              height: style.height || '40px',
            }}
          />
        );
      case 'wave':
        return (
          <motion.div
            key={index}
            className={`${baseClasses} rounded ${className}`}
            animate={
              animated && !prefersReducedMotion
                ? {
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              ...style,
              background: `linear-gradient(90deg, 
                rgb(var(--background-secondary)) 25%, 
                rgb(var(--background-tertiary)) 50%, 
                rgb(var(--background-secondary)) 75%)`,
              backgroundSize: '200% 100%',
            }}
          />
        );
      default:
        return (
          <div
            key={index}
            className={`${baseClasses} rounded ${className}`}
            style={style}
          />
        );
    }
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => getSkeletonElement(i))}
      </div>
    );
  }

  return getSkeletonElement();
};

// Button Loading States
interface LoadingButtonProps {
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  success = false,
  error = false,
  children,
  onClick,
  className,
  disabled,
  loadingText = 'Loading...',
  successText,
  errorText,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();

  const getContent = () => {
    if (loading) {
      return (
        <div className="flex items-center space-x-2">
          <Spinner size="sm" />
          <span>{loadingText}</span>
        </div>
      );
    }

    if (success && successText) {
      return (
        <motion.div
          className="flex items-center space-x-2"
          initial={prefersReducedMotion ? {} : { scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <Check className="w-4 h-4" />
          <span>{successText}</span>
        </motion.div>
      );
    }

    if (error && errorText) {
      return (
        <motion.div
          className="flex items-center space-x-2"
          initial={prefersReducedMotion ? {} : { scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <X className="w-4 h-4" />
          <span>{errorText}</span>
        </motion.div>
      );
    }

    return children;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative overflow-hidden transition-all duration-200 ${className} ${
        loading ? 'cursor-not-allowed opacity-75' : ''
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={loading ? 'loading' : success ? 'success' : error ? 'error' : 'default'}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {getContent()}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};