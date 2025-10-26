import { useTranslation } from 'react-i18next';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore, colorThemes } from '../../stores/theme';
import { SimpleLanguageSelector } from '../common/SimpleLanguageSelector';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { t, i18n } = useTranslation();
  const { config, setColorThemeWithBackend, toggleTheme } = useThemeStore();



  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ThemeIcon = themeIcons[config.mode];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Header with theme and language controls */}
      <header className="absolute top-0 right-0 p-4 sm:p-6 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <SimpleLanguageSelector 
            variant="compact" 
            className="text-sm"
          />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-card backdrop-blur-sm border border-border rounded-lg hover:bg-accent transition-colors shadow-sm"
            title={`${t('settings.themeSettings.modes.' + config.mode)} theme`}
          >
            <ThemeIcon className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Color Theme Selector */}
          <div className="flex items-center gap-1 bg-card backdrop-blur-sm border border-border rounded-lg p-1 shadow-sm">
            {Object.entries(colorThemes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => setColorThemeWithBackend(key as any)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  config.colorTheme === key
                    ? 'border-foreground scale-110'
                    : 'border-border hover:scale-105'
                }`}
                style={{ backgroundColor: theme.primary[500] }}
                title={theme.name}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Centered Auth Card */}
      <div className="w-full max-w-md">
        {/* Auth card */}
        <div className="bg-card rounded-xl shadow-xl border border-border p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}