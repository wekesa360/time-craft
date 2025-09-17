/**
 * Responsive Hook
 * React hook for responsive design and breakpoint detection
 */

import { useState, useEffect } from 'react';
import { 
  getCurrentBreakpoint, 
  isMobile, 
  isTablet, 
  isDesktop,
  matchesMediaQuery,
  mediaQueries,
  getResponsiveValue,
} from '../utils/responsive';
import type { Breakpoint, ResponsiveProps } from '../utils/responsive';

// Hook for current breakpoint
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => getCurrentBreakpoint());

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

// Hook for device type detection
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState(() => ({
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
  }));

  useEffect(() => {
    const handleResize = () => {
      setDeviceType({
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop(),
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};

// Hook for media query matching
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => matchesMediaQuery(query));

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

// Hook for responsive values
export const useResponsiveValue = <T>(
  responsiveProps: ResponsiveProps<T>,
  fallback: T
): T => {
  const breakpoint = useBreakpoint();
  
  return getResponsiveValue(responsiveProps, fallback);
};

// Hook for window dimensions
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Hook for container queries (experimental)
export const useContainerQuery = (containerRef: React.RefObject<HTMLElement>) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return containerSize;
};

// Hook for responsive grid columns
export const useResponsiveGrid = (
  columns: ResponsiveProps<number>,
  fallback: number = 1
) => {
  const cols = useResponsiveValue(columns, fallback);
  
  return {
    columns: cols,
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    className: `grid-cols-${cols}`,
  };
};

// Hook for responsive spacing
export const useResponsiveSpacing = (
  spacing: ResponsiveProps<string>,
  fallback: string = '1rem'
) => {
  return useResponsiveValue(spacing, fallback);
};

// Hook for responsive typography
export const useResponsiveTypography = (
  fontSize: ResponsiveProps<string>,
  fallback: string = '1rem'
) => {
  const size = useResponsiveValue(fontSize, fallback);
  
  return {
    fontSize: size,
    style: { fontSize: size },
  };
};

// Hook for orientation detection
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(() => 
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth 
      ? 'portrait' 
      : 'landscape'
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

// Hook for responsive visibility
export const useResponsiveVisibility = (
  visibility: ResponsiveProps<boolean>,
  fallback: boolean = true
) => {
  return useResponsiveValue(visibility, fallback);
};

// Comprehensive responsive hook
export const useResponsive = () => {
  const breakpoint = useBreakpoint();
  const deviceType = useDeviceType();
  const windowSize = useWindowSize();
  const orientation = useOrientation();

  return {
    breakpoint,
    ...deviceType,
    windowSize,
    orientation,
    
    // Utility functions
    getValue: <T>(responsiveProps: ResponsiveProps<T>, fallback: T) => 
      getResponsiveValue(responsiveProps, fallback),
    
    // Media query helpers
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2Xl: breakpoint === '2xl',
    
    // Size helpers
    isSmallScreen: deviceType.isMobile,
    isMediumScreen: deviceType.isTablet,
    isLargeScreen: deviceType.isDesktop,
    
    // Orientation helpers
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
};