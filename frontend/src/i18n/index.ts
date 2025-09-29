// Internationalization configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { localStorageCoordinator } from '../lib/localStorageCoordinator';

// Import translation files
import en from './locales/en.json';
import de from './locales/de.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en', // Default language
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      // Use coordinator for safe localStorage access
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
    },
    
    react: {
      useSuspense: false,
    },
    
    // Enhanced fallback configuration
    fallbackNS: false,
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,
    
    // Logging configuration for development
    debug: process.env.NODE_ENV === 'development',
    
    // Missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}`);
      }
    },
    
    // Load configuration
    load: 'languageOnly', // Load only language code (e.g., 'de' instead of 'de-DE')
    cleanCode: true,
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
  });

export default i18n;