import { useTranslation } from 'react-i18next';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore, colorThemes } from '../../stores/theme';
import { SimpleLanguageSelector } from '../common/SimpleLanguageSelector';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { t, i18n } = useTranslation();
  const { config, setColorTheme, toggleTheme } = useThemeStore();



  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ThemeIcon = themeIcons[config.mode];

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
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
            className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
            title={`${t('settings.themeSettings.modes.' + config.mode)} theme`}
          >
            <ThemeIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Color Theme Selector */}
          <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
            {Object.entries(colorThemes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => setColorTheme(key as any)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  config.colorTheme === key
                    ? 'border-gray-900 dark:border-gray-100 scale-110'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
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
        {/* App branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('app.name')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('app.tagline')}
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}