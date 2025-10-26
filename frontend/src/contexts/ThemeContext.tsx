import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createTheme, 
  getEffectiveTheme, 
  saveThemeToStorage, 
  loadThemeFromStorage,
  detectSystemTheme,
  generateThemeCSS 
} from '../lib/theme';
import type { 
  Theme, 
  ThemeMode, 
  ColorScheme,
} from '../lib/theme';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  colorScheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
  toggleMode: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  defaultColorScheme?: ColorScheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'system',
  defaultColorScheme = 'orange',
}) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(defaultColorScheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const { mode: storedMode, colorScheme: storedColorScheme } = loadThemeFromStorage();
    setModeState(storedMode);
    setColorSchemeState(storedColorScheme);
    setIsLoaded(true);
  }, []);

  // Create theme
  const theme = createTheme(mode, colorScheme);
  const effectiveTheme = getEffectiveTheme(mode);
  const isDark = effectiveTheme === 'dark';
  const isLight = effectiveTheme === 'light';
  const isSystem = mode === 'system';

  // Set mode and save to storage
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    saveThemeToStorage(newMode, colorScheme);
  };

  // Set color scheme and save to storage
  const setColorScheme = (newColorScheme: ColorScheme) => {
    setColorSchemeState(newColorScheme);
    saveThemeToStorage(mode, newColorScheme);
  };

  // Toggle between light and dark mode
  const toggleMode = () => {
    if (mode === 'system') {
      setMode(isDark ? 'light' : 'dark');
    } else {
      setMode(mode === 'light' ? 'dark' : 'light');
    }
  };

  // Apply theme to document
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;
    
    // Set theme mode class
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    
    // Set data attributes
    root.setAttribute('data-theme-mode', mode);
    root.setAttribute('data-color-scheme', colorScheme);
    
    // Generate and apply CSS custom properties
    const themeCSS = generateThemeCSS(theme);
    
    // Remove existing theme style
    const existingStyle = document.getElementById('theme-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add new theme style
    const style = document.createElement('style');
    style.id = 'theme-css';
    style.textContent = themeCSS;
    document.head.appendChild(style);
    
    // Set meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? theme.colors.gray[900] : theme.colors.gray[50]);
    }
    
  }, [theme, mode, colorScheme, effectiveTheme, isLoaded]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Force re-render when system theme changes
      setModeState('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Don't render until theme is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-muted">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const contextValue: ThemeContextValue = {
    theme,
    mode,
    colorScheme,
    setMode,
    setColorScheme,
    toggleMode,
    isDark,
    isLight,
    isSystem,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme selector component
interface ThemeSelectorProps {
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className = '' }) => {
  const { mode, colorScheme, setMode, setColorScheme, toggleMode } = useTheme();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode selector */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
          Theme Mode
        </label>
        <div className="flex space-x-2">
          {[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setMode(value as ThemeMode)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                mode === value
                  ? 'bg-info-light text-info dark:bg-info dark:text-info-light'
                  : 'text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Color scheme selector */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
          Color Scheme
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'blue', label: 'Blue', color: '#3b82f6' },
            { value: 'green', label: 'Green', color: '#22c55e' },
            { value: 'purple', label: 'Purple', color: '#a855f7' },
            { value: 'orange', label: 'Orange', color: '#f97316' },
            { value: 'red', label: 'Red', color: '#ef4444' },
            { value: 'gray', label: 'Gray', color: '#6b7280' },
          ].map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setColorScheme(value as ColorScheme)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors ${
                colorScheme === value
                  ? 'bg-info-light text-info dark:bg-info dark:text-info-light'
                  : 'text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-white'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color }}
              />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick toggle */}
      <div>
        <button
          onClick={toggleMode}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-info rounded-md hover:bg-info transition-colors"
        >
          Toggle Theme
        </button>
      </div>
    </div>
  );
};

// Theme-aware component wrapper
interface ThemeAwareProps {
  children: React.ReactNode;
  lightClassName?: string;
  darkClassName?: string;
  className?: string;
}

export const ThemeAware: React.FC<ThemeAwareProps> = ({
  children,
  lightClassName = '',
  darkClassName = '',
  className = '',
}) => {
  const { isDark } = useTheme();
  
  const combinedClassName = `${className} ${isDark ? darkClassName : lightClassName}`.trim();
  
  return (
    <div className={combinedClassName}>
      {children}
    </div>
  );
};

export default ThemeProvider;
