import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  useAvailableLanguagesQuery, 
  useCurrentLanguage 
} from '../../hooks/queries/useLocalizationQueries';
import { useLanguageTransition } from '../../hooks/useLanguageTransition';
import { useAuthStore } from '../../stores/auth';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons' | 'compact';
  showLabel?: boolean;
  showFlags?: boolean;
  className?: string;
  onLanguageChange?: (language: string) => void;
  preserveState?: boolean; // New prop to control state preservation
  animationDuration?: number; // Animation duration in ms
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = memo(({ 
  variant = 'dropdown', 
  showLabel = true,
  showFlags = true,
  className = '',
  onLanguageChange,
  preserveState = true,
  animationDuration = 300
}) => {
  const { t } = useTranslation();
  const currentLanguage = useCurrentLanguage();
  const { data: languages, isLoading } = useAvailableLanguagesQuery();
  const { updateLanguage, isLoading: isUpdatingLanguage } = useAuthStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousLanguage, setPreviousLanguage] = useState(currentLanguage);
  
  const { performLanguageTransition } = useLanguageTransition({
    preserveFormData: preserveState,
    preserveScrollPosition: preserveState,
    animationDuration,
    onTransitionStart: () => setIsTransitioning(true),
    onTransitionEnd: () => setIsTransitioning(false)
  });
  
  const handleLanguageChange = useCallback(async (languageCode: string) => {
    if (languageCode === currentLanguage || isTransitioning || isUpdatingLanguage) return;
    
    try {
      setPreviousLanguage(currentLanguage);
      
      await performLanguageTransition(languageCode, async () => {
        await updateLanguage(languageCode);
      });
      
      // Close dropdown
      setIsOpen(false);
      
      // Call callback
      onLanguageChange?.(languageCode);
      
    } catch (error) {
      console.error('Error updating language:', error);
    }
  }, [currentLanguage, isTransitioning, isUpdatingLanguage, performLanguageTransition, updateLanguage, onLanguageChange]);

  // Effect to handle language changes from external sources
  useEffect(() => {
    if (currentLanguage !== previousLanguage && !isTransitioning) {
      setPreviousLanguage(currentLanguage);
    }
  }, [currentLanguage, previousLanguage, isTransitioning]);

  const getLanguageFlag = useCallback((code: string) => {
    const flags = {
      en: '🇺🇸',
      de: '🇩🇪',
    };
    return flags[code as keyof typeof flags] || '🌐';
  }, []);

  // Fallback languages if API fails - memoized to prevent re-creation
  const fallbackLanguages = useMemo(() => [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' }
  ], []);
  
  const availableLanguages = useMemo(() => languages || fallbackLanguages, [languages, fallbackLanguages]);

  const getCurrentLanguageInfo = useMemo(() => {
    if (!languages) {
      return {
        code: currentLanguage,
        name: currentLanguage === 'de' ? 'Deutsch' : 'English',
        nativeName: currentLanguage === 'de' ? 'Deutsch' : 'English'
      };
    }
    
    return languages.find(lang => lang.code === currentLanguage) || {
      code: currentLanguage,
      name: currentLanguage === 'de' ? 'Deutsch' : 'English',
      nativeName: currentLanguage === 'de' ? 'Deutsch' : 'English'
    };
  }, [languages, currentLanguage]);

  // Show transition state
  const isChanging = isUpdatingLanguage || isTransitioning;

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-600 rounded h-8 w-20 ${className}`} />
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 self-center transition-opacity duration-300">
            {t('settings.language')}:
          </span>
        )}
        {availableLanguages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            disabled={isChanging}
            className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 ${
              currentLanguage === language.code
                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-102'
            } ${isTransitioning && currentLanguage === language.code ? 'animate-pulse' : ''}`}
          >
            {showFlags && (
              <span className={`mr-1 transition-transform duration-300 ${
                isTransitioning && currentLanguage === language.code ? 'animate-bounce' : ''
              }`}>
                {getLanguageFlag(language.code)}
              </span>
            )}
            {language.nativeName}
            {isChanging && currentLanguage === language.code && (
              <div className="absolute inset-0 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUpdatingLanguage}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          {showFlags && <span>{getLanguageFlag(currentLanguage)}</span>}
          <span className="uppercase font-medium">{currentLanguage}</span>
          <span className={`transform transition-transform text-xs ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <>
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[120px] animate-in slide-in-from-top-2 duration-200">
              {availableLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  disabled={isChanging}
                  className={`relative w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 ${
                    currentLanguage === language.code
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {showFlags && (
                    <span className={`transition-transform duration-200 ${
                      isTransitioning && currentLanguage === language.code ? 'animate-pulse' : ''
                    }`}>
                      {getLanguageFlag(language.code)}
                    </span>
                  )}
                  <span>{language.nativeName}</span>
                  {currentLanguage === language.code && !isChanging && (
                    <span className="ml-auto text-blue-600 dark:text-blue-400 animate-in fade-in duration-200">✓</span>
                  )}
                  {isChanging && currentLanguage === language.code && (
                    <div className="ml-auto w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('settings.language')}
        </label>
      )}
      
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdatingLanguage}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          {showFlags && <span>{getLanguageFlag(currentLanguage)}</span>}
          <span>{getCurrentLanguageInfo.nativeName}</span>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isUpdatingLanguage}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 ${
                  currentLanguage === language.code
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {showFlags && <span>{getLanguageFlag(language.code)}</span>}
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

          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}

      {/* Loading indicator */}
      {isChanging && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all duration-300">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {/* Transition overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg animate-pulse"></div>
      )}
    </div>
  );
});

// Add display name for debugging
LanguageSelector.displayName = 'LanguageSelector';