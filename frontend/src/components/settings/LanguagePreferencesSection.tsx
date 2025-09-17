import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, AlertCircle, Info } from 'lucide-react';
import { LanguageSelector } from '../common/LanguageSelector';
import { useCurrentLanguage } from '../../hooks/queries/useLocalizationQueries';
import { GermanTextOptimizer, GermanTitle } from '../common/GermanTextOptimizer';

interface LanguagePreferencesSectionProps {
  className?: string;
}

export const LanguagePreferencesSection: React.FC<LanguagePreferencesSectionProps> = ({
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = useCurrentLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const languageInfo = {
    en: {
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      coverage: 100,
      status: 'complete'
    },
    de: {
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      coverage: 95,
      status: 'active'
    }
  };

  const currentLangInfo = languageInfo[currentLanguage as keyof typeof languageInfo] || languageInfo.en;

  return (
    <GermanTextOptimizer className={`card p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <Globe className="w-5 h-5 text-primary-500" aria-hidden="true" />
        <GermanTitle level={2} className="text-xl font-semibold text-foreground">
          {t('settings.language', 'Language Preferences')}
        </GermanTitle>
      </div>

      <div className="space-y-6">
        {/* Current Language Status */}
        <div className="bg-primary-50 dark:bg-primary-950 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{currentLangInfo.flag}</span>
            <div>
              <h3 className="font-medium text-primary-900 dark:text-primary-100">
                {t('localization.currentLanguage', 'Current Language')}: {currentLangInfo.nativeName}
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                {t('localization.status.active', 'Active')} • {currentLangInfo.coverage}% {t('localization.coverage', 'coverage')}
              </p>
            </div>
            <div className="ml-auto">
              <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            {t('localization.languageSettings', 'Language Settings')}
          </label>
          <LanguageSelector 
            variant="dropdown" 
            showLabel={false}
            showFlags={true}
            className="max-w-sm"
            preserveState={true}
            animationDuration={300}
          />
          <p className="text-xs text-foreground-secondary mt-2">
            {t('localization.languageChangeNote', 'Changes will be applied immediately and saved to your profile')}
          </p>
        </div>

        {/* Language Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h4 className="font-medium text-green-900 dark:text-green-100">
                {t('localization.features.complete', 'Complete Translation')}
              </h4>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200">
              {t('localization.features.completeDesc', 'All interface elements are translated')}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                {t('localization.features.accessibility', 'Accessibility Support')}
              </h4>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('localization.features.accessibilityDesc', 'Screen reader and keyboard navigation support')}
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="font-medium text-purple-900 dark:text-purple-100">
                {t('localization.features.cultural', 'Cultural Adaptations')}
              </h4>
            </div>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {t('localization.features.culturalDesc', 'Date formats, number formats, and regional settings')}
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <h4 className="font-medium text-orange-900 dark:text-orange-100">
                {t('localization.features.fallback', 'Smart Fallback')}
              </h4>
            </div>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              {t('localization.features.fallbackDesc', 'Automatic fallback to English for missing translations')}
            </p>
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <span>{showAdvanced ? t('common.hide', 'Hide') : t('common.show', 'Show')} {t('localization.advancedSettings', 'Advanced Settings')}</span>
            <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    {t('localization.autoDetect', 'Auto-detect Language')}
                  </h4>
                  <p className="text-xs text-foreground-secondary">
                    {t('localization.autoDetectDesc', 'Automatically detect language from browser settings')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    aria-label={t('localization.autoDetect', 'Auto-detect Language')}
                  />
                  <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    {t('localization.syncAcrossDevices', 'Sync Across Devices')}
                  </h4>
                  <p className="text-xs text-foreground-secondary">
                    {t('localization.syncAcrossDevicesDesc', 'Keep language preference synchronized across all your devices')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    defaultChecked
                    aria-label={t('localization.syncAcrossDevices', 'Sync Across Devices')}
                  />
                  <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    {t('localization.showTranslationKeys', 'Show Translation Keys')}
                  </h4>
                  <p className="text-xs text-foreground-secondary">
                    {t('localization.showTranslationKeysDesc', 'Display translation keys for debugging (developers only)')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    aria-label={t('localization.showTranslationKeys', 'Show Translation Keys')}
                  />
                  <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
          <button 
            className="btn-secondary text-sm"
            onClick={() => window.open('/localization', '_blank')}
          >
            {t('localization.fullSettings', 'Full Language Settings')}
          </button>
          <button className="btn-outline text-sm">
            {t('localization.reportIssue', 'Report Translation Issue')}
          </button>
          <button className="btn-outline text-sm">
            {t('localization.requestLanguage', 'Request New Language')}
          </button>
        </div>
      </div>
    </GermanTextOptimizer>
  );
};