/**
 * Stack Component
 * Flexible stack layout with responsive spacing and direction
 */

import React from 'react';
import type { ElementType } from 'react';
import { cn } from '../../../utils/cn';
import { useResponsiveValue } from '../../../hooks/useResponsive';
import type { ResponsiveProps } from '../../../utils/responsive';

interface StackProps {
  children: React.ReactNode;
  direction?: ResponsiveProps<'row' | 'column'> | 'row' | 'column';
  spacing?: ResponsiveProps<string> | string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
  as?: ElementType;
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const Stack: React.FC<StackProps> = ({
  children,
  direction = 'column',
  spacing = '1rem',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  as: Component = 'div',
}) => {
  const responsiveDirection = typeof direction === 'string' 
    ? direction 
    : useResponsiveValue(direction, 'column');

  const responsiveSpacing = typeof spacing === 'string' 
    ? spacing 
    : useResponsiveValue(spacing, '1rem');

  const getFlexDirection = () => {
    return responsiveDirection === 'row' ? 'flex-row' : 'flex-col';
  };

  const getGapClass = () => {
    // Convert spacing to Tailwind gap classes
    const spacingMap: Record<string, string> = {
      '0': 'gap-0',
      '0.25rem': 'gap-1',
      '0.5rem': 'gap-2',
      '0.75rem': 'gap-3',
      '1rem': 'gap-4',
      '1.25rem': 'gap-5',
      '1.5rem': 'gap-6',
      '2rem': 'gap-8',
      '2.5rem': 'gap-10',
      '3rem': 'gap-12',
    };

    return spacingMap[responsiveSpacing] || 'gap-4';
  };

  return (
    <Component
      className={cn(
        'flex',
        getFlexDirection(),
        getGapClass(),
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default Stack;