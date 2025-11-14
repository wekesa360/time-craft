import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Language = 'en' | 'de';
export type ColorTheme = 'blue' | 'green' | 'purple' | 'red';

interface PreferencesState {
  themeMode: ThemeMode;
  language: Language;
  colorTheme: ColorTheme;

  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
  setColorTheme: (color: ColorTheme) => void;

  // derived helpers
  effectiveTheme: 'light' | 'dark';
}

const colorToHex: Record<ColorTheme, string> = {
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  red: '#EF4444',
};

export const preferencesColors = {
  primaryFor: (color: ColorTheme) => colorToHex[color],
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      language: 'en',
      colorTheme: 'blue',

      setThemeMode: (mode) => set(() => ({ themeMode: mode })),
      setLanguage: (lang) => set(() => ({ language: lang })),
      setColorTheme: (color) => set(() => ({ colorTheme: color })),

      get effectiveTheme() {
        const mode = get().themeMode;
        if (mode === 'system') {
          const scheme = Appearance.getColorScheme();
          return scheme === 'dark' ? 'dark' : 'light';
        }
        return mode;
      },
    }),
    {
      name: 'preferences-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        language: state.language,
        colorTheme: state.colorTheme,
      }),
    }
  )
);
