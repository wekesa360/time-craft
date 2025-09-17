// Custom hook for theme-aware functionality
import { useEffect, useState } from 'react';
import { useThemeStore, type ColorTheme, type ThemeMode } from '../stores/theme';

interface UseThemeReturn {
  mode: ThemeMode;
  colorTheme: ColorTheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  toggleMode: () => void;
  getThemeClass: (lightClass: string, darkClass: string) => string;
  getColorClass: (colorMap: Record<ColorTheme, string>) => string;
}

export const useTheme = (): UseThemeReturn => {
  const {
    mode,
    colorTheme,
    isDark,
    setMode,
    setColorTheme,
    toggleMode,
  } = useThemeStore();

  // Helper function to get conditional classes based on theme
  const getThemeClass = (lightClass: string, darkClass: string): string => {
    return isDark ? darkClass : lightClass;
  };

  // Helper function to get classes based on color theme
  const getColorClass = (colorMap: Record<ColorTheme, string>): string => {
    return colorMap[colorTheme] || colorMap.blue || '';
  };

  return {
    mode,
    colorTheme,
    isDark,
    setMode,
    setColorTheme,
    toggleMode,
    getThemeClass,
    getColorClass,
  };
};

// Hook for system theme detection
export const useSystemTheme = () => {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return systemTheme;
};

// Hook for theme-aware animations
export const useThemeTransition = () => {
  const { isDark } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [isDark]);

  return { isTransitioning };
};