import React, { useEffect } from 'react';
import { useThemeStore } from '../../stores/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { applyTheme, detectSystemTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme immediately on mount
    applyTheme();

    // Set up system theme change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      detectSystemTheme();
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Clean up listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [applyTheme, detectSystemTheme]);

  // The applyTheme function already handles theme changes internally,
  // so we don't need to listen for the themeChange event here to avoid infinite loops

  return <>{children}</>;
}