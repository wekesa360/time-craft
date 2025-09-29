import React from 'react';
import { useTranslation } from 'react-i18next';
import { SimpleLanguageSelector } from '../common/SimpleLanguageSelector';
import { useLocalization } from '../../contexts/LocalizationContext';
import { withLanguageTransition } from '../common/withLanguageTransition';

const LocalizationSectionComponent: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, isLoading, error } = useLocalization();

  return (
    <section id="language" className="card p-6">
      <div className="space-y-6">
        {/* Current Language Display */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            {t('localization.currentLanguage', 'Current Language')}
          </label>
          <div className="flex items-center space-x-3 p-3 bg-background-secondary rounded-lg border border-border">
            <span className="text-2xl">
              {currentLanguage === 'de' ? '🇩🇪' : '🇺🇸'}
            </span>
            <span className="font-medium text-foreground">
              {currentLanguage === 'de' ? 'Deutsch' : 'English'}
            </span>
            {isLoading && (
              <div className="ml-auto">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            {t('localization.languageSettings', 'Select Language')}
          </label>
          <SimpleLanguageSelector 
            variant="dropdown" 
            className="w-full max-w-sm"
          />
          <p className="text-sm text-foreground-secondary mt-2">
            {t('localization.languageChangeNote', 'Language changes will be saved to your profile and applied across all devices.')}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              {t('localization.error', 'Failed to update language. Please try again.')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

// Export with language transition support
export const LocalizationSection = withLanguageTransition(LocalizationSectionComponent);