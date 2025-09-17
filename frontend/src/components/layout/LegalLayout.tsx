import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Monitor, ArrowLeft } from 'lucide-react';
import { useThemeStore, colorThemes } from '../../stores/theme';
import { SimpleLanguageSelector } from '../common/SimpleLanguageSelector';

interface LegalLayoutProps {
  children: React.ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  const { t } = useTranslation();
  const { config, setColorTheme, toggleTheme } = useThemeStore();

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ThemeIcon = themeIcons[config.mode];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and branding */}
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">{t('legal.privacyPolicy.backToSignIn')}</span>
              </Link>
              
              <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <Link to="/" className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('app.name')}
                </h1>
              </Link>
            </div>

            {/* Right side - Theme and language controls */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <SimpleLanguageSelector 
                variant="compact" 
                className="text-sm"
              />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={`${t('settings.themeSettings.modes.' + config.mode)} theme`}
              >
                <ThemeIcon className="h-5 w-5" />
              </button>

              {/* Color Theme Selector */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                {t('legal.termsOfService.title')}
              </Link>
              <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                {t('legal.privacyPolicy.title')}
              </Link>
              <Link to="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                {t('auth.login')}
              </Link>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} {t('app.name')}. {t('legal.footer.allRightsReserved')}.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}