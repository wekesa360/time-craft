/**
 * Responsive Design Utilities
 * Breakpoint management and responsive helpers
 */

// Tailwind CSS breakpoints
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Media query utilities
export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  
  // Max-width queries
  'max-xs': `(max-width: ${breakpoints.sm - 1}px)`,
  'max-sm': `(max-width: ${breakpoints.md - 1}px)`,
  'max-md': `(max-width: ${breakpoints.lg - 1}px)`,
  'max-lg': `(max-width: ${breakpoints.xl - 1}px)`,
  'max-xl': `(max-width: ${breakpoints['2xl'] - 1}px)`,
  
  // Range queries
  'sm-md': `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.lg - 1}px)`,
  'md-lg': `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.xl - 1}px)`,
  'lg-xl': `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints['2xl'] - 1}px)`,
} as const;

// Check if window matches media query
export const matchesMediaQuery = (query: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
};

// Get current breakpoint
export const getCurrentBreakpoint = (): Breakpoint => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

// Check if current screen is mobile
export const isMobile = (): boolean => {
  return matchesMediaQuery(mediaQueries['max-md']);
};

// Check if current screen is tablet
export const isTablet = (): boolean => {
  return matchesMediaQuery(mediaQueries['sm-md']);
};

// Check if current screen is desktop
export const isDesktop = (): boolean => {
  return matchesMediaQuery(mediaQueries.lg);
};

// Responsive value selector
export const getResponsiveValue = <T>(
  values: Partial<Record<Breakpoint, T>>,
  fallback: T
): T => {
  const currentBreakpoint = getCurrentBreakpoint();
  
  // Try current breakpoint first
  if (values[currentBreakpoint] !== undefined) {
    return values[currentBreakpoint]!;
  }
  
  // Fall back to smaller breakpoints
  const orderedBreakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = orderedBreakpoints.indexOf(currentBreakpoint);
  
  for (let i = currentIndex + 1; i < orderedBreakpoints.length; i++) {
    const bp = orderedBreakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }
  
  return fallback;
};

// Container max-widths (matching Tailwind's container)
export const containerMaxWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Grid column utilities
export const getGridCols = (
  cols: Partial<Record<Breakpoint, number>>,
  fallback: number = 1
): number => {
  return getResponsiveValue(cols, fallback);
};

// Spacing utilities
export const getResponsiveSpacing = (
  spacing: Partial<Record<Breakpoint, string>>,
  fallback: string = '1rem'
): string => {
  return getResponsiveValue(spacing, fallback);
};

// Typography utilities
export const getResponsiveFontSize = (
  sizes: Partial<Record<Breakpoint, string>>,
  fallback: string = '1rem'
): string => {
  return getResponsiveValue(sizes, fallback);
};

// Layout utilities
export const getResponsiveLayout = <T extends string>(
  layouts: Partial<Record<Breakpoint, T>>,
  fallback: T
): T => {
  return getResponsiveValue(layouts, fallback);
};

// CSS-in-JS responsive helper
export const responsive = (
  styles: Partial<Record<Breakpoint, React.CSSProperties>>
): React.CSSProperties => {
  const currentBreakpoint = getCurrentBreakpoint();
  
  // Merge styles from smallest to current breakpoint
  const orderedBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = orderedBreakpoints.indexOf(currentBreakpoint);
  
  let mergedStyles: React.CSSProperties = {};
  
  for (let i = 0; i <= currentIndex; i++) {
    const bp = orderedBreakpoints[i];
    if (styles[bp]) {
      mergedStyles = { ...mergedStyles, ...styles[bp] };
    }
  }
  
  return mergedStyles;
};

// Aspect ratio utilities
export const aspectRatios = {
  square: '1/1',
  video: '16/9',
  photo: '4/3',
  portrait: '3/4',
  wide: '21/9',
} as const;

export type AspectRatio = keyof typeof aspectRatios;

export const getAspectRatioStyle = (ratio: AspectRatio | string): React.CSSProperties => {
  const aspectRatio = aspectRatios[ratio as AspectRatio] || ratio;
  return {
    aspectRatio,
  };
};

// Responsive image utilities
export const getResponsiveImageSizes = (
  sizes: Partial<Record<Breakpoint, string>>,
  fallback: string = '100vw'
): string => {
  const sizeQueries: string[] = [];
  
  Object.entries(sizes).forEach(([bp, size]) => {
    const breakpoint = bp as Breakpoint;
    if (breakpoint !== 'xs') {
      sizeQueries.push(`${mediaQueries[breakpoint]} ${size}`);
    }
  });
  
  // Add fallback size
  sizeQueries.push(sizes.xs || fallback);
  
  return sizeQueries.join(', ');
};

// Responsive component props helper
export interface ResponsiveProps<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

export const useResponsiveValue = <T>(
  responsiveProps: ResponsiveProps<T>,
  fallback: T
): T => {
  return getResponsiveValue(responsiveProps, fallback);
};