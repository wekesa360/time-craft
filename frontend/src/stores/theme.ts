// Theme store with Zustand - supports dark/light/system themes and color themes
import { create } from 'zustand';
import { createPersistedStore, persistenceConfigs } from '../lib/storePersistence';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorTheme = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'red' | 'indigo' | 'yellow' | 'emerald';

export interface ThemeConfig {
  mode: ThemeMode;
  colorTheme: ColorTheme;
  systemTheme: 'light' | 'dark'; // Detected system preference
}

interface ThemeStore {
  config: ThemeConfig;
  effectiveTheme: 'light' | 'dark'; // The actual theme being used
  isTransitioning: boolean; // To prevent flashing during theme changes
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  toggleTheme: () => void;
  detectSystemTheme: () => void;
  applyTheme: () => void;
  getColorThemeConfig: (theme?: ColorTheme) => any;
  getAllColorThemes: () => Array<{ key: ColorTheme; name: string; colors: any }>;
  previewColorTheme: (colorTheme: ColorTheme) => void;
  resetPreview: () => void;
}

// Color theme configurations
export const colorThemes: Record<ColorTheme, any> = {
  blue: {
    name: 'Ocean Blue',
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
  green: {
    name: 'Forest Green',
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
  },
  purple: {
    name: 'Royal Purple',
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
  },
  orange: {
    name: 'Sunset Orange',
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
  },
  pink: {
    name: 'Cherry Pink',
    primary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
      950: '#500724',
    },
  },
  teal: {
    name: 'Ocean Teal',
    primary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    },
  },
  red: {
    name: 'Crimson Red',
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
  },
  indigo: {
    name: 'Deep Indigo',
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
  },
  yellow: {
    name: 'Golden Yellow',
    primary: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
      950: '#422006',
    },
  },
  emerald: {
    name: 'Emerald Green',
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
  },
};

const detectSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  // Check if window.matchMedia exists (it might not in tests)
  if (!window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeStore>()(
  createPersistedStore(
    (set, get) => ({
      config: {
        mode: 'system',
        colorTheme: 'blue',
        systemTheme: detectSystemTheme(),
      },
      effectiveTheme: detectSystemTheme(),
      isTransitioning: false,

      setThemeMode: (mode) => {
        const { config } = get();
        const newConfig = { ...config, mode };
        const effectiveTheme = mode === 'system' ? config.systemTheme : mode;
        
        set({
          config: newConfig,
          effectiveTheme,
        });
        
        get().applyTheme();
      },

      setColorTheme: (colorTheme) => {
        const { config } = get();
        set({
          config: { ...config, colorTheme },
        });
        
        get().applyTheme();
      },

      toggleTheme: () => {
        const { config } = get();
        if (config.mode === 'system') {
          // If system mode, switch to opposite of current system theme
          const newMode = config.systemTheme === 'light' ? 'dark' : 'light';
          get().setThemeMode(newMode);
        } else {
          // Toggle between light and dark
          const newMode = config.mode === 'light' ? 'dark' : 'light';
          get().setThemeMode(newMode);
        }
      },

      detectSystemTheme: () => {
        const systemTheme = detectSystemTheme();
        const { config } = get();
        
        set({
          config: { ...config, systemTheme },
          effectiveTheme: config.mode === 'system' ? systemTheme : config.mode,
        });
        
        get().applyTheme();
      },

      applyTheme: () => {
        if (typeof window === 'undefined') return;
        
        const { config, effectiveTheme } = get();
        const root = document.documentElement;
        
        // Prevent transition flashing
        set({ isTransitioning: true });
        root.classList.add('theme-transition-disable');
        
        // Apply dark/light theme
        if (effectiveTheme === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
        
        // Apply color theme by updating CSS custom properties
        const colorConfig = colorThemes[config.colorTheme];
        if (colorConfig) {
          Object.entries(colorConfig.primary).forEach(([shade, color]) => {
            root.style.setProperty(`--color-primary-${shade}`, color as string);
          });
          
          // Set theme color meta tag for mobile browsers
          const metaThemeColor = document.querySelector('meta[name="theme-color"]');
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', colorConfig.primary[600] as string);
          }
          
          // Update favicon color if needed
          const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (favicon) {
            // You could dynamically generate favicons based on theme here
          }
        }
        
        // Re-enable transitions after a brief delay
        setTimeout(() => {
          root.classList.remove('theme-transition-disable');
          set({ isTransitioning: false });
        }, 50);
        
        // Dispatch custom event for theme change
        window.dispatchEvent(
          new CustomEvent('themeChange', {
            detail: { effectiveTheme, colorTheme: config.colorTheme },
          })
        );
      },

      getColorThemeConfig: (theme) => {
        const themeKey = theme || get().config.colorTheme;
        return colorThemes[themeKey];
      },

      getAllColorThemes: () => {
        return Object.entries(colorThemes).map(([key, config]) => ({
          key: key as ColorTheme,
          name: config.name,
          colors: config.primary,
        }));
      },

      previewColorTheme: (colorTheme) => {
        if (typeof window === 'undefined') return;
        
        const root = document.documentElement;
        const colorConfig = colorThemes[colorTheme];
        
        if (colorConfig) {
          Object.entries(colorConfig.primary).forEach(([shade, color]) => {
            root.style.setProperty(`--color-primary-${shade}`, color as string);
          });
        }
      },

      resetPreview: () => {
        get().applyTheme();
      },
    }),
    {
      ...persistenceConfigs.theme,
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately after rehydration
        if (state) {
          // Update system theme detection
          state.detectSystemTheme();
          state.applyTheme();
          
          // Set up system theme listener
          if (typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', state.detectSystemTheme);
          }
        }
      },
    }
  )
);