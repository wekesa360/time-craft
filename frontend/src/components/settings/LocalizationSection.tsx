import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, AlertCircle, Loader2 } from 'lucide-react';
import { LanguageSelector } from '../common/LanguageSelector';
import { useLocalization } from '../../contexts/LocalizationContext';
import { withLanguageTransition } from '../common/withLanguageTransition';
import { withGermanTextHeavy } from '../common/withGermanTextLayout';
import { GermanText, GermanHeading } from '../common/GermanText';

interface PreviewSection {
  key: string;
  title: string;
  content: string[];
}

const LocalizationSectionComponent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentLanguage, isLoading, error } = useLocalization();
  const [previewMode, setPreviewMode] = useState<'current' | 'preview'>('current');

  // Sample content for preview in different languages
  const getPreviewSections = (lang: string): PreviewSection[] => [
    {
      key: 'navigation',
      title: t('localization.preview.navigation'),
      content: [
        t('navigation.dashboard'),
        t('navigation.tasks'),
        t('navigation.health'),
        t('navigation.calendar'),
        t('navigation.settings')
      ]
    },
    {
      key: 'actions',
      title: t('localization.preview.actions'),
      content: [
        t('common.save'),
        t('common.cancel'),
        t('common.delete'),
        t('common.edit'),
        t('common.create')
      ]
    },
    {
      key: 'status',
      title: t('localization.preview.status'),
      content: [
        t('common.loading'),
        t('common.success'),
        t('common.error'),
        t('common.warning'),
        t('common.info')
      ]
    }
  ];

  const currentSections = getPreviewSections(currentLanguage);

  return (
    <section id="language" className="card p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Globe className="w-5 h-5 text-primary-500" />
        <GermanHeading level={2} className="text-xl font-semibold text-foreground">
          {t('localization.title')}
        </GermanHeading>
      </div>
      
      <div className="space-y-6">
        {/* Current Language Status */}
        <div className="bg-background-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">
              {t('localization.currentLanguage')}
            </h3>
            <div className="flex items-center space-x-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
              {error && <AlertCircle className="w-4 h-4 text-red-500" />}
              {!isLoading && !error && <Check className="w-4 h-4 text-green-500" />}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {currentLanguage === 'de' ? '🇩🇪' : '🇺🇸'}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t(`settings.languages.${currentLanguage}`)}
                </p>
                <p className="text-xs text-foreground-secondary">
                  {currentLanguage === 'de' ? 'Deutsch' : 'English'}
                </p>
              </div>
            </div>
            
            <div className="ml-auto">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isLoading 
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : error
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {isLoading 
                  ? t('localization.status.loading')
                  : error 
                  ? t('localization.status.error')
                  : t('localization.status.active')
                }
              </span>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            {t('localization.languageSettings')}
          </label>
          <LanguageSelector 
            variant="buttons" 
            showLabel={false}
            className="w-full"
          />
          <p className="text-sm text-foreground-secondary mt-2">
            {t('settings.language')} changes will be saved to your profile and applied across all devices.
          </p>
        </div>

        {/* Interface Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">
              {t('localization.interfacePreview')}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode('current')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  previewMode === 'current'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setPreviewMode('preview')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  previewMode === 'preview'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          <div className="bg-background-secondary rounded-lg p-4">
            <p className="text-xs text-foreground-secondary mb-4">
              {t('localization.preview.description')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentSections.map((section) => (
                <div key={section.key} className="space-y-2">
                  <h4 className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {section.content.map((item, index) => (
                      <div
                        key={index}
                        className="text-sm text-foreground bg-background rounded px-2 py-1"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-start space-x-3">
            <Globe className="w-4 h-4 text-primary-500 mt-0.5" />
            <div className="text-sm text-foreground-secondary">
              <p className="mb-1">
                Language preferences are synchronized across all your devices and sessions.
              </p>
              <p>
                If translations are missing, the interface will automatically fall back to English.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Export with language transition support
export const LocalizationSection = withLanguageTransition(LocalizationSectionComponent, {
  preserveState: true,
  animationClass: 'language-transition-fade',
  transitionDuration: 300
});