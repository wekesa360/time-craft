/**
 * Optimized translation hooks with performance enhancements
 * Includes memoization, caching, and selective re-rendering optimizations
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation, TFunction } from 'react-i18next';
import { useCurrentLanguage } from './queries/useLocalizationQueries';

// Cache for translated strings to avoid re-computation
const translationCache = new Map<string, string>();

// Interface for optimized translation options
interface OptimizedTranslationOptions {
  enableCache?: boolean;
  namespace?: string;
  keyPrefix?: string;
  fallback?: string;
}

/**
 * Optimized translation hook with caching and memoization
 */
export const useOptimizedTranslation = (options: OptimizedTranslationOptions = {}) => {
  const { enableCache = true, namespace, keyPrefix, fallback } = options;
  const { t: originalT, i18n } = useTranslation(namespace);
  const currentLanguage = useCurrentLanguage();
  const cacheKeyRef = useRef<string>('');

  // Update cache key when language changes
  useEffect(() => {
    cacheKeyRef.current = `${currentLanguage}_${namespace || 'default'}`;
    
    // Clear cache when language changes to prevent stale translations
    if (enableCache) {
      translationCache.clear();
    }
  }, [currentLanguage, namespace, enableCache]);

  // Memoized translation function with caching
  const t = useCallback<TFunction>((key: any, options?: any) => {
    const fullKey = keyPrefix ? `${keyPrefix}.${key}` : key;
    const cacheKey = `${cacheKeyRef.current}_${fullKey}_${JSON.stringify(options || {})}`;
    
    // Check cache first if enabled
    if (enableCache && translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }
    
    // Get translation
    const translation = originalT(fullKey, { ...options, defaultValue: fallback });
    
    // Cache the result if enabled
    if (enableCache && typeof translation === 'string') {
      translationCache.set(cacheKey, translation);
    }
    
    return translation;
  }, [originalT, keyPrefix, fallback, enableCache]);

  // Memoized batch translation function
  const tBatch = useCallback((keys: string[], options?: any) => {
    return keys.map(key => t(key, options));
  }, [t]);

  // Memoized translation with interpolation
  const tWithValues = useCallback((key: string, values: Record<string, any>, options?: any) => {
    return t(key, { ...options, ...values });
  }, [t]);

  return useMemo(() => ({
    t,
    tBatch,
    tWithValues,
    i18n,
    language: currentLanguage,
    isReady: i18n.isInitialized
  }), [t, tBatch, tWithValues, i18n, currentLanguage]);
};

/**
 * Hook for static translations that don't change often
 * Uses aggressive memoization to prevent unnecessary re-renders
 */
export const useStaticTranslation = (keys: string | string[], namespace?: string) => {
  const { t } = useTranslation(namespace);
  const currentLanguage = useCurrentLanguage();

  return useMemo(() => {
    if (Array.isArray(keys)) {
      return keys.reduce((acc, key) => {
        acc[key] = t(key);
        return acc;
      }, {} as Record<string, string>);
    }
    return t(keys);
  }, [t, keys, currentLanguage]);
};

/**
 * Hook for form-specific translations with validation messages
 */
export const useFormTranslation = (formName: string) => {
  const { t } = useOptimizedTranslation({
    keyPrefix: `forms.${formName}`,
    enableCache: true
  });

  const getFieldLabel = useCallback((fieldName: string) => {
    return t(`fields.${fieldName}.label`, { defaultValue: fieldName });
  }, [t]);

  const getFieldPlaceholder = useCallback((fieldName: string) => {
    return t(`fields.${fieldName}.placeholder`, { defaultValue: '' });
  }, [t]);

  const getFieldError = useCallback((fieldName: string, errorType: string) => {
    return t(`fields.${fieldName}.errors.${errorType}`, { 
      defaultValue: t(`common.errors.${errorType}`, { defaultValue: 'Invalid value' })
    });
  }, [t]);

  const getValidationMessage = useCallback((fieldName: string, validationType: string) => {
    return t(`fields.${fieldName}.validation.${validationType}`, { defaultValue: '' });
  }, [t]);

  return useMemo(() => ({
    t,
    getFieldLabel,
    getFieldPlaceholder,
    getFieldError,
    getValidationMessage
  }), [t, getFieldLabel, getFieldPlaceholder, getFieldError, getValidationMessage]);
};

/**
 * Hook for navigation translations with route-specific caching
 */
export const useNavigationTranslation = () => {
  const { t } = useOptimizedTranslation({
    keyPrefix: 'navigation',
    enableCache: true
  });

  const navigationItems = useMemo(() => ({
    dashboard: t('dashboard'),
    tasks: t('tasks'),
    health: t('health'),
    calendar: t('calendar'),
    focus: t('focus'),
    badges: t('badges'),
    analytics: t('analytics'),
    settings: t('settings'),
    localization: t('localization'),
    social: t('social'),
    voice: t('voice'),
    notifications: t('notifications'),
    student: t('student'),
    admin: t('admin')
  }), [t]);

  return { t, navigationItems };
};

/**
 * Hook for error message translations with fallbacks
 */
export const useErrorTranslation = () => {
  const { t } = useOptimizedTranslation({
    keyPrefix: 'errors',
    enableCache: true,
    fallback: 'An error occurred'
  });

  const getErrorMessage = useCallback((errorCode: string, context?: Record<string, any>) => {
    return t(errorCode, { ...context, defaultValue: t('generic', 'An error occurred') });
  }, [t]);

  const getValidationError = useCallback((field: string, rule: string, context?: Record<string, any>) => {
    return t(`validation.${field}.${rule}`, { 
      ...context, 
      defaultValue: t(`validation.generic.${rule}`, { 
        ...context, 
        defaultValue: 'Invalid value' 
      })
    });
  }, [t]);

  return useMemo(() => ({
    t,
    getErrorMessage,
    getValidationError
  }), [t, getErrorMessage, getValidationError]);
};

/**
 * Performance monitoring hook for translation usage
 */
export const useTranslationPerformance = () => {
  const renderCountRef = useRef(0);
  const translationCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
  });

  const trackTranslation = useCallback(() => {
    translationCountRef.current += 1;
  }, []);

  const getStats = useCallback(() => {
    const now = Date.now();
    const duration = now - startTimeRef.current;
    
    return {
      renderCount: renderCountRef.current,
      translationCount: translationCountRef.current,
      duration,
      translationsPerSecond: translationCountRef.current / (duration / 1000),
      cacheSize: translationCache.size
    };
  }, []);

  const resetStats = useCallback(() => {
    renderCountRef.current = 0;
    translationCountRef.current = 0;
    startTimeRef.current = Date.now();
    translationCache.clear();
  }, []);

  return { trackTranslation, getStats, resetStats };
};

/**
 * Clear translation cache manually
 */
export const clearTranslationCache = () => {
  translationCache.clear();
};

/**
 * Get translation cache statistics
 */
export const getTranslationCacheStats = () => {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys())
  };
};