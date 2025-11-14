import { theme as baseTheme } from './theme';
import { usePreferencesStore, preferencesColors } from '../stores/preferences';

export function useAppTheme() {
  const colorTheme = usePreferencesStore((s) => s.colorTheme);
  const effectiveTheme = usePreferencesStore((s) => s.effectiveTheme);
  const primary = preferencesColors.primaryFor(colorTheme);

  const darkColors = {
    background: '#0B0B0C',
    foreground: '#E5E7EB',
    card: '#111214',
    cardForeground: '#E5E7EB',
    popover: '#111214',
    popoverForeground: '#E5E7EB',
    secondary: '#141518',
    secondaryForeground: '#E5E7EB',
    muted: '#9CA3AF',
    mutedAlt: '#6B7280',
    mutedForeground: '#D1D5DB',
    accent: '#141518',
    accentForeground: '#E5E7EB',
    border: '#1F2937',
    input: '#0F1115',
    ring: primary,
    surface: '#0F1115',
    surfaceAlt: '#0B0B0C',
    black: '#000000',
    blackForeground: '#FFFFFF',
    primaryForeground: '#FFFFFF',
    info: primary,
    infoBg: '#0B1324',
    successBg: '#0F2E23',
    warningBg: '#3A2A0F',
  } as const;

  const colors = effectiveTheme === 'dark'
    ? { ...baseTheme.colors, ...darkColors, primary, ring: primary }
    : { ...baseTheme.colors, primary, ring: primary };

  return {
    ...baseTheme,
    colors,
  } as const;
}
