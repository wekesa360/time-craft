import { type ColorTheme } from '../stores/theme';

// Utility functions for theme-related operations

/**
 * Get CSS custom property value
 */
export function getCSSCustomProperty(property: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}

/**
 * Set CSS custom property value
 */
export function setCSSCustomProperty(property: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(property, value);
}

/**
 * Generate color variations for a given color
 */
export function generateColorVariations(baseColor: string): Record<string, string> {
  // This is a simplified version - in a real app you might use a color manipulation library
  const variations: Record<string, string> = {};
  
  // For now, return the base color for all variations
  // In a real implementation, you'd generate lighter/darker variations
  for (let i = 50; i <= 950; i += i < 100 ? 50 : 100) {
    variations[i.toString()] = baseColor;
  }
  
  return variations;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Calculate luminance of a color
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if a color meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get the appropriate text color (black or white) for a background color
 */
export function getTextColorForBackground(backgroundColor: string): string {
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const factor = 1 - percent / 100;

  return rgbToHex(
    Math.round(r * factor),
    Math.round(g * factor),
    Math.round(b * factor)
  );
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const factor = percent / 100;

  return rgbToHex(
    Math.round(r + (255 - r) * factor),
    Math.round(g + (255 - g) * factor),
    Math.round(b + (255 - b) * factor)
  );
}

/**
 * Create a color palette from a base color
 */
export function createColorPalette(baseColor: string): Record<string, string> {
  const palette: Record<string, string> = {};
  
  // Generate lighter shades
  palette['50'] = lightenColor(baseColor, 95);
  palette['100'] = lightenColor(baseColor, 90);
  palette['200'] = lightenColor(baseColor, 75);
  palette['300'] = lightenColor(baseColor, 60);
  palette['400'] = lightenColor(baseColor, 30);
  
  // Base color
  palette['500'] = baseColor;
  
  // Generate darker shades
  palette['600'] = darkenColor(baseColor, 15);
  palette['700'] = darkenColor(baseColor, 30);
  palette['800'] = darkenColor(baseColor, 45);
  palette['900'] = darkenColor(baseColor, 60);
  palette['950'] = darkenColor(baseColor, 75);
  
  return palette;
}

/**
 * Apply a custom color theme
 */
export function applyCustomColorTheme(colors: Record<string, string>): void {
  Object.entries(colors).forEach(([shade, color]) => {
    setCSSCustomProperty(`--color-primary-${shade}`, color);
  });
}

/**
 * Get system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Theme-aware class name generator
 */
export function themeClasses(
  lightClasses: string,
  darkClasses: string,
  currentTheme?: 'light' | 'dark'
): string {
  if (currentTheme) {
    return currentTheme === 'dark' ? darkClasses : lightClasses;
  }
  
  // Return both with dark: prefix for automatic switching
  return `${lightClasses} dark:${darkClasses.split(' ').join(' dark:')}`;
}

/**
 * Generate theme-aware gradient
 */
export function createThemeGradient(
  direction: string,
  colors: string[],
  isDark: boolean = false
): string {
  const adjustedColors = colors.map(color => 
    isDark ? darkenColor(color, 20) : color
  );
  
  return `linear-gradient(${direction}, ${adjustedColors.join(', ')})`;
}

/**
 * Color theme presets for quick selection
 */
export const colorThemePresets: Record<ColorTheme, { name: string; primary: string; description: string }> = {
  blue: { name: 'Ocean Blue', primary: '#3b82f6', description: 'Professional and trustworthy' },
  green: { name: 'Forest Green', primary: '#22c55e', description: 'Natural and calming' },
  purple: { name: 'Royal Purple', primary: '#a855f7', description: 'Creative and luxurious' },
  orange: { name: 'Sunset Orange', primary: '#f97316', description: 'Energetic and warm' },
  pink: { name: 'Cherry Pink', primary: '#ec4899', description: 'Playful and vibrant' },
  teal: { name: 'Ocean Teal', primary: '#14b8a6', description: 'Fresh and modern' },
  red: { name: 'Crimson Red', primary: '#ef4444', description: 'Bold and powerful' },
  indigo: { name: 'Deep Indigo', primary: '#6366f1', description: 'Sophisticated and deep' },
  yellow: { name: 'Golden Yellow', primary: '#eab308', description: 'Bright and optimistic' },
  emerald: { name: 'Emerald Green', primary: '#10b981', description: 'Rich and elegant' },
};

/**
 * Export theme configuration for external use
 */
export function exportThemeConfig() {
  const root = document.documentElement;
  const config: Record<string, string> = {};
  
  // Get all CSS custom properties
  const styles = getComputedStyle(root);
  for (let i = 0; i < styles.length; i++) {
    const property = styles[i];
    if (property.startsWith('--color-')) {
      config[property] = styles.getPropertyValue(property).trim();
    }
  }
  
  return config;
}