import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SimpleLanguageSelectorProps {
  variant?: 'dropdown' | 'compact';
  className?: string;
}

export const SimpleLanguageSelector: React.FC<SimpleLanguageSelectorProps> = ({ 
  variant = 'compact',
  className = ''
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Hardcoded languages - no API calls needed
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
  ];

  const currentLanguage = i18n.language || 'en';

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) return;
    
    try {
      await i18n.changeLanguage(languageCode);
      setIsOpen(false);
      
      // Store in localStorage for persistence (using i18next's expected key)
      localStorage.setItem('i18nextLng', languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const getCurrentLanguageInfo = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 rounded hover:bg-white dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-600"
          title="Change language"
        >
          <span>{getCurrentLanguageInfo().flag}</span>
          <span className="uppercase font-medium">{currentLanguage}</span>
          <span className={`transform transition-transform text-xs ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <>
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[120px]">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    currentLanguage === language.code
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <span>{language.flag}</span>
                  <span>{language.nativeName}</span>
                  {currentLanguage === language.code && (
                    <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
          </>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{getCurrentLanguageInfo().flag}</span>
          <span>{getCurrentLanguageInfo().nativeName}</span>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  currentLanguage === language.code
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                <span>{language.flag}</span>
                <div>
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{language.name}</div>
                </div>
                {currentLanguage === language.code && (
                  <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                )}
              </button>
            ))}
          </div>

          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};