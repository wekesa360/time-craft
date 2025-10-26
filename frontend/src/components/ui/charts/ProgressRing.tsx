/**
 * Progress Ring Component
 * Circular progress indicator with customizable styling
 */

import React from 'react';
import { cn } from '../../../utils/cn';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  value?: string | number;
  label?: string;
  className?: string;
  animated?: boolean;
  duration?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  showValue = false,
  value,
  label,
  className,
  animated = true,
  duration = 1000,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="dark:stroke-gray-600"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={animated ? 'transition-all ease-out' : ''}
          style={{
            transitionDuration: animated ? `${duration}ms` : '0ms',
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {showPercentage && (
          <span className="text-lg font-bold text-foreground dark:text-white">
            {Math.round(progress)}%
          </span>
        )}
        {showValue && value !== undefined && (
          <span className="text-lg font-bold text-foreground dark:text-white">
            {value}
          </span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
export { ProgressRing };