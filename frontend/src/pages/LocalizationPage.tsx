import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LocalizationSection } from '../components/settings/LocalizationSection';

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
        
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-foreground">
            {t('localization.title', 'Language Settings')}
          </h1>
        </div>
        
        <p className="text-foreground-secondary">
          {t('localization.subtitle', 'Choose your preferred language for the interface')}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Localization Settings */}
        <LocalizationSection />
      </div>
    </div>
  );
}