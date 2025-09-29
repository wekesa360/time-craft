import React from 'react';
import { useTranslation } from 'react-i18next';
import { SimpleLanguageSelector } from '../common/SimpleLanguageSelector';
import { useCurrentLanguage } from '../../hooks/queries/useLocalizationQueries';

interface LanguagePreferencesSectionProps {
  className?: string;
}

export const LanguagePreferencesSection: React.FC<LanguagePreferencesSectionProps> = ({
  className = ''
}) => {
  const { t } = useTranslation();
  const { data: currentLanguage, isLoading } = useCurrentLanguage();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Language Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          {t('localization.languageSettings', 'Language Settings')}
        </label>
        <SimpleLanguageSelector 
          variant="dropdown" 
          className="max-w-sm"
        />
        <p className="text-xs text-foreground-secondary mt-2">
          {t('localization.languageChangeNote', 'Changes will be applied immediately and saved to your profile')}
        </p>
      </div>

      {/* Current Language Status */}
      {currentLanguage && (
        <div className="p-3 bg-background-secondary rounded-lg border border-border">
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {currentLanguage === 'de' ? '🇩🇪' : '🇺🇸'}
            </span>
            <span className="text-sm font-medium text-foreground">
              {t('localization.currentLanguage', 'Current Language')}: {currentLanguage === 'de' ? 'Deutsch' : 'English'}
            </span>
            {isLoading && (
              <div className="ml-auto">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};