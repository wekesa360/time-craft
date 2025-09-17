import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LocalizationSection } from '../components/settings/LocalizationSection';
import { GermanAccessibilityDemo } from '../components/demo/GermanAccessibilityDemo';
import { NavigationDemo } from '../components/demo/NavigationDemo';
import { SettingsIntegrationDemo } from '../components/demo/SettingsIntegrationDemo';

export default function LocalizationPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link 
            to="/settings" 
            className="flex items-center space-x-2 text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('common.back')} to Settings</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-3 mb-2">
          <Globe className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-foreground">
            {t('localization.title')}
          </h1>
        </div>
        
        <p className="text-foreground-secondary">
          Manage your language preferences and preview the interface in different languages
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Localization Settings */}
        <LocalizationSection />

        {/* Navigation Demo */}
        <NavigationDemo />

        {/* Settings Integration Demo */}
        <SettingsIntegrationDemo />

        {/* German Accessibility Demo */}
        <GermanAccessibilityDemo />

        {/* Additional Information Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            About Localization
          </h2>
          
          <div className="space-y-4 text-sm text-foreground-secondary">
            <div>
              <h3 className="font-medium text-foreground mb-2">Supported Languages</h3>
              <ul className="space-y-1 ml-4">
                <li className="flex items-center space-x-2">
                  <span>🇺🇸</span>
                  <span>English (Default)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>🇩🇪</span>
                  <span>Deutsch (German)</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-2">Features</h3>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Complete interface translation</li>
                <li>Automatic fallback to English for missing translations</li>
                <li>Real-time language switching</li>
                <li>Persistent language preferences across devices</li>
                <li>Preview interface in different languages</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-2">Technical Details</h3>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Translations are cached for optimal performance</li>
                <li>Language changes are synchronized across all sessions</li>
                <li>Missing translations are logged for improvement</li>
                <li>Supports right-to-left languages (future enhancement)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="card p-6 bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
                Help Improve Translations
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300 mb-3">
                Found a translation that could be improved? We'd love to hear from you!
              </p>
              <button className="btn-primary text-sm">
                Provide Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}