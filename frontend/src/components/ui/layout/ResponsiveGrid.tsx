/**
 * Enhanced Responsive Grid Component
 * Flexible grid layout with responsive column configuration and accessibility features
 */

import React, { useRef, useEffect } from 'react';
import { cn } from '../../../utils/cn';
import { useResponsiveGrid } from '../../../hooks/useResponsive';
import { useAccessibilityContext } from '../../accessibility/AccessibilityProvider';
import { ResponsiveProps } from '../../../utils/responsive';

interface ResponsiveGridProps extends ResponsiveProps<number> {
  children: React.ReactNode;
  gap?: ResponsiveProps<string> | string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  minItemWidth?: string;
  autoFit?: boolean;
  autoFill?: boolean;
  ariaLabel?: string;
  role?: string;
  enableKeyboardNavigation?: boolean;
  announceChanges?: boolean;
  id?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  gap = '1rem',
  className,
  as: Component = 'div',
  minItemWidth,
  autoFit = false,
  autoFill = false,
  ariaLabel,
  role,
  enableKeyboardNavigation = false,
  announceChanges = false,
  id,
  xs = 1,
  sm,
  md,
  lg,
  xl,
  '2xl': xxl,
}) => {
  const { gridTemplateColumns, columns } = useResponsiveGrid(
    { xs, sm, md, lg, xl, '2xl': xxl },
    xs
  );
  
  const { 
    announce, 
    handleKeyPress, 
    breakpoint, 
    prefersReducedMotion,
    language 
  } = useAccessibilityContext();
  
  const gridRef = useRef<HTMLElement>(null);
  const previousColumns = useRef<number>(columns);

  // Announce grid changes
  useEffect(() => {
    if (announceChanges && columns !== previousColumns.current) {
      const message = language === 'de'
        ? `Rasteransicht geändert zu ${columns} Spalten`
        : `Grid layout changed to ${columns} columns`;
      announce(message, 'polite');
      previousColumns.current = columns;
    }
  }, [columns, announceChanges, announce, language]);

  // Keyboard navigation for grid items
  useEffect(() => {
    if (!enableKeyboardNavigation || !gridRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gridRef.current) return;
      
      const focusableElements = Array.from(
        gridRef.current.querySelectorAll('[tabindex="0"], button, [href], input, select, textarea')
      ) as HTMLElement[];
      
      if (focusableElements.length === 0) return;
      
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      
      switch (event.key) {
        case 'ArrowRight':
          nextIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          nextIndex = Math.min(currentIndex + columns, focusableElements.length - 1);
          break;
        case 'ArrowUp':
          nextIndex = Math.max(currentIndex - columns, 0);
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = focusableElements.length - 1;
          break;
        default:
          return;
      }
      
      if (nextIndex !== currentIndex) {
        event.preventDefault();
        focusableElements[nextIndex]?.focus();
      }
    };

    const gridElement = gridRef.current;
    gridElement.addEventListener('keydown', handleKeyDown);
    
    return () => {
      gridElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardNavigation, columns]);

  const getResponsiveGap = (): string => {
    if (typeof gap === 'string') return gap;
    
    const gapValue = gap || {};
    const fallback = '1rem';
    
    // Get appropriate gap for current breakpoint
    switch (breakpoint) {
      case 'xs': return gapValue.xs || fallback;
      case 'sm': return gapValue.sm || gapValue.xs || fallback;
      case 'md': return gapValue.md || gapValue.sm || gapValue.xs || fallback;
      case 'lg': return gapValue.lg || gapValue.md || gapValue.sm || gapValue.xs || fallback;
      case 'xl': return gapValue.xl || gapValue.lg || gapValue.md || gapValue.sm || gapValue.xs || fallback;
      case '2xl': return gapValue['2xl'] || gapValue.xl || gapValue.lg || gapValue.md || gapValue.sm || gapValue.xs || fallback;
      default: return fallback;
    }
  };

  const getGridStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      display: 'grid',
      gap: getResponsiveGap(),
    };

    if (minItemWidth && (autoFit || autoFill)) {
      const repeatType = autoFit ? 'auto-fit' : 'auto-fill';
      style.gridTemplateColumns = `repeat(${repeatType}, minmax(${minItemWidth}, 1fr))`;
    } else {
      style.gridTemplateColumns = gridTemplateColumns;
    }
    
    // Add transition for smooth column changes if motion is not reduced
    if (!prefersReducedMotion) {
      style.transition = 'grid-template-columns 0.3s ease';
    }

    return style;
  };

  const accessibilityProps = {
    ...(ariaLabel && { 'aria-label': ariaLabel }),
    ...(role && { role }),
    ...(enableKeyboardNavigation && { 
      tabIndex: 0,
      'aria-describedby': `${id || 'grid'}-instructions`
    }),
    ...(id && { id }),
  };

  return (
    <>
      <Component
        ref={gridRef as any}
        className={cn(
          'responsive-grid',
          {
            'keyboard-navigable': enableKeyboardNavigation,
            'high-contrast-grid': prefersReducedMotion, // Use different styling for high contrast
          },
          className
        )}
        style={getGridStyle()}
        {...accessibilityProps}
      >
        {children}
      </Component>
      
      {enableKeyboardNavigation && (
        <div 
          id={`${id || 'grid'}-instructions`} 
          className="sr-only"
          aria-live="polite"
        >
          {language === 'de' 
            ? 'Verwenden Sie die Pfeiltasten, um durch die Rasterelemente zu navigieren. Home/End für Anfang/Ende.'
            : 'Use arrow keys to navigate through grid items. Home/End for start/end.'
          }
        </div>
      )}
    </>
  );
};

export default ResponsiveGrid;