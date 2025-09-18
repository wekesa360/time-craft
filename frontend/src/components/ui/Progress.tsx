import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showLabel?: boolean;
  label?: string;
  className?: string;
  'aria-label'?: string;
}

const sizeStyles = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const variantStyles = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = true,
  label,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayLabel = label || `${Math.round(percentage)}%`;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          <span>{displayLabel}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div
        className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeStyles[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel || `Progress: ${percentage}%`}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showLabel?: boolean;
  label?: string;
  className?: string;
  'aria-label'?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showLabel = true,
  label,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  };

  const displayLabel = label || `${Math.round(percentage)}%`;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-label={ariaLabel || `Circular progress: ${percentage}%`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayLabel}
          </span>
        </div>
      )}
    </div>
  );
};

interface StepProgressProps {
  steps: Array<{
    id: string;
    label: string;
    description?: string;
    status: 'pending' | 'current' | 'completed' | 'error';
  }>;
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  className = '',
}) => {
  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (status: string, index: number) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'current':
        return (
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {index + 1}
            </span>
          </div>
        );
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="flex">
              <div className="flex flex-col items-center">
                {getStepIcon(status, index)}
                {!isLast && (
                  <div className={`w-0.5 h-8 mt-2 ${
                    status === 'completed' ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
              
              <div className="ml-4 flex-1">
                <h3 className={`text-sm font-medium ${
                  status === 'current' ? 'text-blue-600' : 
                  status === 'completed' ? 'text-green-600' : 
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.label}
                </h3>
                {step.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              {getStepIcon(status, index)}
              <h3 className={`text-xs font-medium mt-2 ${
                status === 'current' ? 'text-blue-600' : 
                status === 'completed' ? 'text-green-600' : 
                'text-gray-500 dark:text-gray-400'
              }`}>
                {step.label}
              </h3>
            </div>
            
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-4 ${
                status === 'completed' ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Progress;
