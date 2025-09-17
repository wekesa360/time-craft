// React Query hooks for localization
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { getErrorMessage } from '../../lib/queryClient';

import { toast } from 'react-hot-toast';
import i18n from '../../i18n';

// Query keys
export const localizationKeys = {
  all: ['localization'] as const,
  languages: () => [...localizationKeys.all, 'languages'] as const,
  content: (language: string) => [...localizationKeys.all, 'content', language] as const,

};

// Available languages query
export const useAvailableLanguagesQuery = () => {
  return useQuery({
    queryKey: localizationKeys.languages(),
    queryFn: async () => {
      try {
        return await apiClient.getAvailableLanguages();
      } catch (error) {
        // Return fallback languages if API fails
        console.warn('Failed to fetch languages from API, using fallback:', error);
        return [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'de', name: 'German', nativeName: 'Deutsch' }
        ];
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: false, // Don't retry since we have fallback data
  });
};

// Localization content query
export const useLocalizationContentQuery = (language: string) => {
  return useQuery({
    queryKey: localizationKeys.content(language),
    queryFn: () => apiClient.getLocalizedContent(language),
    enabled: !!language,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};



// Update user language mutation
export const useUpdateUserLanguageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (language: string) => apiClient.updateUserLanguage(language),
    onMutate: async (language) => {
      // Change i18n language immediately for better UX
      i18n.changeLanguage(language);
      
      return { previousLanguage: i18n.language };
    },
    onSuccess: (_, language) => {
      // Show success message in the new language
      const message = language === 'de' 
        ? 'Sprache erfolgreich geändert!' 
        : 'Language changed successfully!';
      toast.success(message);
      
      // Invalidate localization content for the new language to ensure fresh data
      queryClient.invalidateQueries({ queryKey: localizationKeys.content(language) });
    },
    onError: (error: unknown, language, context) => {
      // Revert i18n language change
      const previousLanguage = context?.previousLanguage || 'en';
      i18n.changeLanguage(previousLanguage);
      
      // Show error message - safely extract string
      const message = getErrorMessage(error, 'Failed to update language');
      toast.error(message);
      
      console.error('Language update error:', error);
    },
  });
};

// Hook to get current language with fallback
export const useCurrentLanguage = () => {
  // Try to get from auth store first, then fallback to i18n
  return i18n.language || 'en';
};

// Hook to prefetch localization data
export const usePrefetchLocalization = () => {
  const queryClient = useQueryClient();
  
  const prefetchLanguages = () => {
    queryClient.prefetchQuery({
      queryKey: localizationKeys.languages(),
      queryFn: () => apiClient.getAvailableLanguages(),
      staleTime: 60 * 60 * 1000,
    });
  };
  
  const prefetchContent = (language: string) => {
    queryClient.prefetchQuery({
      queryKey: localizationKeys.content(language),
      queryFn: () => apiClient.getLocalizedContent(language),
      staleTime: 30 * 60 * 1000,
    });
  };
  
  return {
    prefetchLanguages,
    prefetchContent,
  };
};

// Hook for translation with fallback
export const useTranslationWithFallback = () => {
  const currentLanguage = useCurrentLanguage();
  const { data: localizationContent } = useLocalizationContentQuery(currentLanguage);
  
  const translate = (key: string, fallback?: string): string => {
    // Try to get translation from API data first
    if (localizationContent?.content[key]) {
      return localizationContent.content[key];
    }
    
    // Fall back to i18n
    const i18nTranslation = i18n.t(key);
    if (i18nTranslation !== key) {
      return i18nTranslation;
    }
    
    // Use provided fallback or return key
    if (fallback) {
      return fallback;
    }
    
    // Log missing translation for development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation for key: ${key} in language: ${currentLanguage}`);
    }
    
    return key;
  };
  
  return { translate, isLoading: !localizationContent };
};