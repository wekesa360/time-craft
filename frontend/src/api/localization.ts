import { apiClient } from '../lib/api';

export interface LocalizationResponse {
  translations: Record<string, string>;
  metadata: {
    language: string;
    version: string;
    coverage: number;
    lastUpdated: string;
  };
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
  coverage: number;
}

export interface LanguagesResponse {
  languages: LanguageInfo[];
}

/**
 * Fetch localization content for a specific language
 */
export const fetchLocalizationContent = async (languageCode: string): Promise<LocalizationResponse> => {
  const response = await apiClient.get(`/localization/content/${languageCode}`);
  return response.data;
};

/**
 * Fetch available languages
 */
export const fetchAvailableLanguages = async (): Promise<LanguagesResponse> => {
  const response = await apiClient.get('/localization/languages');
  return response.data;
};

/**
 * Update translation for a specific key
 */
export const updateTranslation = async (
  languageCode: string,
  key: string,
  value: string
): Promise<void> => {
  await apiClient.put(`/localization/content/${languageCode}/${key}`, { value });
};

/**
 * Bulk update translations
 */
export const bulkUpdateTranslations = async (
  languageCode: string,
  translations: Record<string, string>
): Promise<void> => {
  await apiClient.put(`/localization/content/${languageCode}`, { translations });
};

/**
 * Get translation statistics
 */
export const fetchTranslationStats = async (languageCode?: string) => {
  const url = languageCode 
    ? `/localization/stats/${languageCode}`
    : '/localization/stats';
  
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Export translations for a language
 */
export const exportTranslations = async (
  languageCode: string,
  format: 'json' | 'csv' | 'xlsx' = 'json'
): Promise<Blob> => {
  const response = await apiClient.get(`/localization/export/${languageCode}`, {
    params: { format },
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Import translations for a language
 */
export const importTranslations = async (
  languageCode: string,
  file: File,
  format: 'json' | 'csv' | 'xlsx' = 'json'
): Promise<{ imported: number; errors: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);

  const response = await apiClient.post(`/localization/import/${languageCode}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};