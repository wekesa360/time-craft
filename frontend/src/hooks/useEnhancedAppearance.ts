import { useState, useEffect, useCallback } from 'react';

export type FontSize = 'small' | 'medium' | 'large';
export type AnimationLevel = 'none' | 'reduced' | 'full';
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

export interface EnhancedAppearanceSettings {
  fontSize: FontSize;
  animationLevel: AnimationLevel;
  layoutDensity: LayoutDensity;
  highContrast: boolean;
  reducedMotion: boolean;
}

const STORAGE_KEY = 'enhanced-appearance-settings';

const defaultSettings: EnhancedAppearanceSettings = {
  fontSize: 'medium',
  animationLevel: 'full',
  layoutDensity: 'comfortable',
  highContrast: false,
  reducedMotion: false,
};

export function useEnhancedAppearance() {
  const [settings, setSettings] = useState<EnhancedAppearanceSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.warn('Failed to load enhanced appearance settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply settings to DOM
  useEffect(() => {
    if (isLoading) return;

    const root = document.documentElement;
    
    // Apply font size class
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${settings.fontSize}`);
    
    // Apply layout density class
    root.classList.remove('layout-compact', 'layout-comfortable', 'layout-spacious');
    root.classList.add(`layout-${settings.layoutDensity}`);
    
    // Apply animation level class
    root.classList.remove('animations-none', 'animations-reduced', 'animations-full');
    root.classList.add(`animations-${settings.animationLevel}`);
    
    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save enhanced appearance settings:', error);
    }
  }, [settings, isLoading]);

  // Detect system preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches && !settings.reducedMotion) {
        setSettings(prev => ({ ...prev, reducedMotion: true }));
      }
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    
    // Initial check
    if (mediaQuery.matches && !settings.reducedMotion) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [settings.reducedMotion]);

  const updateSetting = useCallback(<K extends keyof EnhancedAppearanceSettings>(
    key: K,
    value: EnhancedAppearanceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const updateFontSize = useCallback((fontSize: FontSize) => {
    updateSetting('fontSize', fontSize);
  }, [updateSetting]);

  const updateAnimationLevel = useCallback((animationLevel: AnimationLevel) => {
    updateSetting('animationLevel', animationLevel);
  }, [updateSetting]);

  const updateLayoutDensity = useCallback((layoutDensity: LayoutDensity) => {
    updateSetting('layoutDensity', layoutDensity);
  }, [updateSetting]);

  const toggleHighContrast = useCallback(() => {
    updateSetting('highContrast', !settings.highContrast);
  }, [settings.highContrast, updateSetting]);

  const toggleReducedMotion = useCallback(() => {
    updateSetting('reducedMotion', !settings.reducedMotion);
  }, [settings.reducedMotion, updateSetting]);

  // Backend integration methods
  const saveToBackend = useCallback(async () => {
    try {
      const { apiClient } = await import('../lib/api');
      await apiClient.updateUserPreferences({
        appearance: settings
      });
      console.log('Enhanced appearance settings saved to backend');
    } catch (error) {
      console.error('Failed to save enhanced appearance settings to backend:', error);
    }
  }, [settings]);

  const loadFromBackend = useCallback(async () => {
    try {
      const { apiClient } = await import('../lib/api');
      const preferences = await apiClient.getUserPreferences();
      
      if (preferences?.appearance) {
        setSettings(prev => ({ ...prev, ...preferences.appearance }));
        console.log('Enhanced appearance settings loaded from backend');
      }
    } catch (error) {
      console.error('Failed to load enhanced appearance settings from backend:', error);
    }
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    updateFontSize,
    updateAnimationLevel,
    updateLayoutDensity,
    toggleHighContrast,
    toggleReducedMotion,
    resetToDefaults,
    saveToBackend,
    loadFromBackend,
  };
}