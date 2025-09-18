// Translation utilities with fallback and error handling
import i18n from '../i18n';

interface TranslationOptions {
  fallback?: string;
  logMissing?: boolean;
  context?: string;
}

// Enhanced translation function with fallback
export const translateWithFallback = (
  key: string, 
  options: TranslationOptions = {}
): string => {
  const { fallback, logMissing = true, context } = options;
  
  try {
    // Try to get translation from i18n
    const translation = i18n.t(key);
    
    // Check if translation exists (i18n returns the key if no translation found)
    if (translation !== key) {
      return translation;
    }
    
    // Try fallback language (English)
    if (i18n.language !== 'en') {
      const englishTranslation = i18n.t(key, { lng: 'en' });
      if (englishTranslation !== key) {
        if (logMissing && process.env.NODE_ENV === 'development') {
          console.warn(`Using English fallback for key: ${key} in language: ${i18n.language}`);
        }
        return englishTranslation;
      }
    }
    
    // Use provided fallback
    if (fallback) {
      if (logMissing && process.env.NODE_ENV === 'development') {
        console.warn(`Using provided fallback for key: ${key} in language: ${i18n.language}`);
      }
      return fallback;
    }
    
    // Log missing translation
    if (logMissing && process.env.NODE_ENV === 'development') {
      const contextInfo = context ? ` (context: ${context})` : '';
      console.warn(`Missing translation for key: ${key} in language: ${i18n.language}${contextInfo}`);
    }
    
    // Return formatted key as last resort
    return formatMissingKey(key);
    
  } catch (error) {
    console.error('Translation error:', error);
    return fallback || formatMissingKey(key);
  }
};

// Format missing key for display
const formatMissingKey = (key: string): string => {
  // Convert dot notation to readable text
  // e.g., "tasks.createTask" -> "Create Task"
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Convert camelCase to Title Case
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// Batch translation function
export const translateBatch = (
  keys: string[], 
  options: TranslationOptions = {}
): Record<string, string> => {
  const result: Record<string, string> = {};
  
  keys.forEach(key => {
    result[key] = translateWithFallback(key, options);
  });
  
  return result;
};

// Translation validation
export const validateTranslations = (
  requiredKeys: string[], 
  language: string = i18n.language
): { missing: string[]; available: string[] } => {
  const missing: string[] = [];
  const available: string[] = [];
  
  requiredKeys.forEach(key => {
    const translation = i18n.t(key, { lng: language });
    if (translation === key) {
      missing.push(key);
    } else {
      available.push(key);
    }
  });
  
  return { missing, available };
};

// Get translation completeness percentage
export const getTranslationCompleteness = (
  requiredKeys: string[], 
  language: string = i18n.language
): number => {
  const { missing, available } = validateTranslations(requiredKeys, language);
  const total = requiredKeys.length;
  const completed = available.length;
  
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

// Translation cache for performance
class TranslationCache {
  private cache = new Map<string, string>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();
  
  get(key: string, language: string): string | null {
    const cacheKey = `${language}:${key}`;
    const timestamp = this.cacheTimestamps.get(cacheKey);
    
    if (timestamp && Date.now() - timestamp < this.cacheTimeout) {
      return this.cache.get(cacheKey) || null;
    }
    
    return null;
  }
  
  set(key: string, language: string, value: string): void {
    const cacheKey = `${language}:${key}`;
    this.cache.set(cacheKey, value);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }
  
  clear(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
  
  clearExpired(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }
}

export const translationCache = new TranslationCache();

// Cached translation function
export const translateCached = (
  key: string, 
  options: TranslationOptions = {}
): string => {
  const language = i18n.language;
  const cached = translationCache.get(key, language);
  
  if (cached) {
    return cached;
  }
  
  const translation = translateWithFallback(key, options);
  translationCache.set(key, language, translation);
  
  return translation;
};

// React hook for translation with fallback
export const useTranslationFallback = () => {
  const translate = (key: string, options: TranslationOptions = {}) => {
    return translateWithFallback(key, options);
  };
  
  const translateCached = (key: string, options: TranslationOptions = {}) => {
    return translateCached(key, options);
  };
  
  const batchTranslate = (keys: string[], options: TranslationOptions = {}) => {
    return translateBatch(keys, options);
  };
  
  return {
    t: translate,
    tc: translateCached,
    tb: batchTranslate,
    language: i18n.language,
    isGerman: i18n.language === 'de',
    isEnglish: i18n.language === 'en',
  };
};

// Error boundary for translation errors
export class TranslationErrorBoundary extends Error {
  key: string;
  language: string;
  context?: string;
  
  constructor(
    message: string,
    key: string,
    language: string,
    context?: string
  ) {
    super(message);
    this.name = 'TranslationError';
    this.key = key;
    this.language = language;
    this.context = context;
  }
}

// Safe translation function that never throws
export const safeTranslate = (
  key: string, 
  fallback: string = key,
  options: TranslationOptions = {}
): string => {
  try {
    return translateWithFallback(key, { ...options, fallback });
  } catch (error) {
    console.error('Safe translation error:', error);
    return fallback;
  }
};

// Development helper to find unused translations
export const findUnusedTranslations = (
  usedKeys: string[], 
  language: string = 'en'
): string[] => {
  if (process.env.NODE_ENV !== 'development') {
    return [];
  }
  
  const allKeys = getAllTranslationKeys(language);
  return allKeys.filter(key => !usedKeys.includes(key));
};

// Get all translation keys from resources
const getAllTranslationKeys = (language: string): string[] => {
  const keys: string[] = [];
  const resources = i18n.getResourceBundle(language, 'translation');
  
  const extractKeys = (obj: any, prefix: string = ''): void => {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractKeys(obj[key], fullKey);
      } else {
        keys.push(fullKey);
      }
    });
  };
  
  if (resources) {
    extractKeys(resources);
  }
  
  return keys;
};