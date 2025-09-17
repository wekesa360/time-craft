/**
 * Container Component
 * Responsive container with max-width constraints
 */

import React from 'react';
import { cn } from '../../../utils/cn';
import { useResponsive } from '../../../hooks/useResponsive';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const sizeClasses = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 py-2',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
  xl: 'px-12 py-8',
};

const Container: React.FC<ContainerProps> = ({
  children,
  size = 'full',
  padding = 'md',
  center = true,
  className,
  as: Component = 'div',
}) => {
  const { isMobile, isTablet } = useResponsive();

  // Adjust padding for mobile devices
  const responsivePadding = isMobile && padding !== 'none' ? 'sm' : padding;

  return (
    <Component
      className={cn(
        'w-full',
        sizeClasses[size],
        paddingClasses[responsivePadding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default Container;