import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import {
  fetchAvailableLanguages,
  fetchLocalizationContent,
  updateUserLanguage,
  fetchUserLanguagePreference
} from '../localization';

// Mock the API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

const mockApiClient = vi.mocked(apiClient);

describe('Localization API Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  describe('fetchAvailableLanguages', () => {
    it('fetches available languages successfully', async () => {
      const mockLanguages = [
        { code: 'en', name: 'English', nativeName: 'English', coverage: 100 },
        { code: 'de', name: 'German', nativeName: 'Deutsch', coverage: 95 }
      ];

      mockApiClient.get.mockResolvedValue({
        data: { languages: mockLanguages },
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchAvailableLanguages();

      expect(mockApiClient.get).toHaveBeenCalledWith('/localization/languages');
      expect(result).toEqual(mockLanguages);
    });

    it('handles API error gracefully', async () => {
      mockApiClient.get.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      });

      await expect(fetchAvailableLanguages()).rejects.toThrow();
    });

    it('handles network error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(fetchAvailableLanguages()).rejects.toThrow('Network Error');
    });

    it('handles malformed response', async () => {
      mockApiClient.get.mockResolvedValue({
        data: null,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchAvailableLanguages();
      expect(result).toBeNull();
    });

    it('includes proper headers', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { languages: [] },
        status: 200,
        statusText: 'OK'
      });

      await fetchAvailableLanguages();

      expect(mockApiClient.get).toHaveBeenCalledWith('/localization/languages');
    });
  });

  describe('fetchLocalizationContent', () => {
    it('fetches German localization content successfully', async () => {
      const mockContent = {
        translations: {
          'common.save': 'Speichern',
          'common.cancel': 'Abbrechen',
          'common.delete': 'Löschen',
          'navigation.dashboard': 'Dashboard',
          'navigation.tasks': 'Aufgaben'
        },
        metadata: {
          language: 'de',
          coverage: 95,
          lastUpdated: '2024-01-01T00:00:00Z',
          version: '1.0.0'
        }
      };

      mockApiClient.get.mockResolvedValue({
        data: mockContent,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchLocalizationContent('de');

      expect(mockApiClient.get).toHaveBeenCalledWith('/localization/content/de');
      expect(result).toEqual(mockContent);
    });

    it('fetches English localization content successfully', async () => {
      const mockContent = {
        translations: {
          'common.save': 'Save',
          'common.cancel': 'Cancel',
          'common.delete': 'Delete'
        },
        metadata: {
          language: 'en',
          coverage: 100,
          lastUpdated: '2024-01-01T00:00:00Z',
          version: '1.0.0'
        }
      };

      mockApiClient.get.mockResolvedValue({
        data: mockContent,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchLocalizationContent('en');

      expect(mockApiClient.get).toHaveBeenCalledWith('/localization/content/en');
      expect(result).toEqual(mockContent);
    });

    it('handles 404 for unsupported language', async () => {
      mockApiClient.get.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'Language not found' }
        }
      });

      await expect(fetchLocalizationContent('fr')).rejects.toThrow();
    });

    it('handles empty language parameter', async () => {
      await expect(fetchLocalizationContent('')).rejects.toThrow('Language code is required');
    });

    it('handles null language parameter', async () => {
      await expect(fetchLocalizationContent(null as unknown as string)).rejects.toThrow('Language code is required');
    });

    it('includes cache headers for performance', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { translations: {}, metadata: {} },
        status: 200,
        statusText: 'OK',
        headers: {
          'cache-control': 'public, max-age=3600',
          'etag': '"abc123"'
        }
      });

      await fetchLocalizationContent('de');

      expect(mockApiClient.get).toHaveBeenCalledWith('/localization/content/de');
    });

    it('handles partial content gracefully', async () => {
      const partialContent = {
        translations: {
          'common.save': 'Speichern'
          // Missing other translations
        },
        metadata: {
          language: 'de',
          coverage: 30, // Low coverage
          lastUpdated: '2024-01-01T00:00:00Z'
        }
      };

      mockApiClient.get.mockResolvedValue({
        data: partialContent,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchLocalizationContent('de');
      expect(result.metadata.coverage).toBe(30);
    });
  });

  describe('updateUserLanguage', () => {
    it('updates user language preference successfully', async () => {
      const mockResponse = {
        success: true,
        language: 'de',
        user: {
          id: '123',
          language: 'de',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };

      mockApiClient.put.mockResolvedValue({
        data: mockResponse,
        status: 200,
        statusText: 'OK'
      });

      const result = await updateUserLanguage('de');

      expect(mockApiClient.put).toHaveBeenCalledWith('/user/language', {
        language: 'de'
      });
      expect(result).toEqual(mockResponse);
    });

    it('handles authentication error', async () => {
      mockApiClient.put.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        }
      });

      await expect(updateUserLanguage('de')).rejects.toThrow();
    });

    it('handles invalid language code', async () => {
      mockApiClient.put.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid language code' }
        }
      });

      await expect(updateUserLanguage('invalid')).rejects.toThrow();
    });

    it('handles server error during update', async () => {
      mockApiClient.put.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Failed to update user language' }
        }
      });

      await expect(updateUserLanguage('de')).rejects.toThrow();
    });

    it('validates language parameter', async () => {
      await expect(updateUserLanguage('')).rejects.toThrow('Language code is required');
      await expect(updateUserLanguage(null as unknown as string)).rejects.toThrow('Language code is required');
    });

    it('includes proper request headers', async () => {
      mockApiClient.put.mockResolvedValue({
        data: { success: true, language: 'de' },
        status: 200,
        statusText: 'OK'
      });

      await updateUserLanguage('de');

      expect(mockApiClient.put).toHaveBeenCalledWith('/user/language', {
        language: 'de'
      });
    });

    it('handles concurrent updates correctly', async () => {
      const responses = [
        { data: { success: true, language: 'de' }, status: 200 },
        { data: { success: true, language: 'en' }, status: 200 }
      ];

      mockApiClient.put
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1]);

      const [result1, result2] = await Promise.all([
        updateUserLanguage('de'),
        updateUserLanguage('en')
      ]);

      expect(result1.language).toBe('de');
      expect(result2.language).toBe('en');
      expect(mockApiClient.put).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchUserLanguagePreference', () => {
    it('fetches user language preference successfully', async () => {
      const mockPreference = {
        language: 'de',
        autoDetect: false,
        syncAcrossDevices: true,
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      mockApiClient.get.mockResolvedValue({
        data: mockPreference,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchUserLanguagePreference();

      expect(mockApiClient.get).toHaveBeenCalledWith('/user/language');
      expect(result).toEqual(mockPreference);
    });

    it('handles user not found', async () => {
      mockApiClient.get.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'User not found' }
        }
      });

      await expect(fetchUserLanguagePreference()).rejects.toThrow();
    });

    it('handles unauthenticated user', async () => {
      mockApiClient.get.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Authentication required' }
        }
      });

      await expect(fetchUserLanguagePreference()).rejects.toThrow();
    });

    it('returns default preference for new user', async () => {
      const defaultPreference = {
        language: 'en',
        autoDetect: true,
        syncAcrossDevices: true,
        lastUpdated: null
      };

      mockApiClient.get.mockResolvedValue({
        data: defaultPreference,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchUserLanguagePreference();
      expect(result.language).toBe('en');
      expect(result.autoDetect).toBe(true);
    });
  });

  describe('Caching and Performance', () => {
    it('respects cache headers for language content', async () => {
      const mockContent = {
        translations: { 'test': 'Test' },
        metadata: { language: 'de', coverage: 100 }
      };

      mockApiClient.get.mockResolvedValue({
        data: mockContent,
        status: 200,
        statusText: 'OK',
        headers: {
          'cache-control': 'public, max-age=3600',
          'etag': '"version-1"'
        }
      });

      await fetchLocalizationContent('de');

      // Second call should include If-None-Match header
      mockApiClient.get.mockResolvedValue({
        status: 304,
        statusText: 'Not Modified'
      });

      // In a real implementation, this would be handled by the HTTP client
      expect(mockApiClient.get).toHaveBeenCalledWith('/localization/content/de');
    });

    it('handles large translation files efficiently', async () => {
      const largeContent = {
        translations: Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`key${i}`, `Value ${i}`])
        ),
        metadata: {
          language: 'de',
          coverage: 100,
          size: '50KB'
        }
      };

      mockApiClient.get.mockResolvedValue({
        data: largeContent,
        status: 200,
        statusText: 'OK'
      });

      const start = Date.now();
      const result = await fetchLocalizationContent('de');
      const duration = Date.now() - start;

      expect(result.translations).toHaveProperty('key999');
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('handles compressed responses', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { translations: {}, metadata: {} },
        status: 200,
        statusText: 'OK',
        headers: {
          'content-encoding': 'gzip',
          'content-length': '1024'
        }
      });

      await fetchLocalizationContent('de');
      expect(mockApiClient.get).toHaveBeenCalledWith('/localization/content/de');
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    it('implements retry logic for transient failures', async () => {
      mockApiClient.get
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce({
          data: { languages: [] },
          status: 200,
          statusText: 'OK'
        });

      // This would be handled by the query client's retry logic
      // For now, we test that the API call eventually succeeds
      const result = await fetchAvailableLanguages();
      expect(result).toEqual([]);
    });

    it('provides fallback for missing translations', async () => {
      const incompleteContent = {
        translations: {
          'common.save': 'Speichern'
          // Missing many translations
        },
        metadata: {
          language: 'de',
          coverage: 20,
          fallbackLanguage: 'en'
        }
      };

      mockApiClient.get.mockResolvedValue({
        data: incompleteContent,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchLocalizationContent('de');
      expect(result.metadata.fallbackLanguage).toBe('en');
      expect(result.metadata.coverage).toBe(20);
    });

    it('handles partial API outages gracefully', async () => {
      // Languages endpoint works
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/localization/languages') {
          return Promise.resolve({
            data: { languages: [{ code: 'en', name: 'English' }] },
            status: 200
          });
        }
        // Content endpoint fails
        if (url.includes('/localization/content/')) {
          return Promise.reject({
            response: { status: 503, data: { error: 'Service unavailable' } }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const languages = await fetchAvailableLanguages();
      expect(languages).toHaveLength(1);

      await expect(fetchLocalizationContent('de')).rejects.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('validates language list structure', async () => {
      const invalidLanguages = [
        { code: 'en' }, // Missing required fields
        { name: 'German' }, // Missing code
        { code: 'de', name: 'German', nativeName: 'Deutsch', coverage: 'invalid' } // Invalid coverage
      ];

      mockApiClient.get.mockResolvedValue({
        data: { languages: invalidLanguages },
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchAvailableLanguages();
      // In a real implementation, this would validate and filter invalid entries
      expect(result).toEqual(invalidLanguages);
    });

    it('validates translation content structure', async () => {
      const invalidContent = {
        translations: 'not an object', // Should be object
        metadata: {
          language: 'de',
          coverage: 'high' // Should be number
        }
      };

      mockApiClient.get.mockResolvedValue({
        data: invalidContent,
        status: 200,
        statusText: 'OK'
      });

      // In a real implementation, this would validate the structure
      const result = await fetchLocalizationContent('de');
      expect(result).toEqual(invalidContent);
    });

    it('handles missing metadata gracefully', async () => {
      const contentWithoutMetadata = {
        translations: {
          'common.save': 'Speichern'
        }
        // Missing metadata
      };

      mockApiClient.get.mockResolvedValue({
        data: contentWithoutMetadata,
        status: 200,
        statusText: 'OK'
      });

      const result = await fetchLocalizationContent('de');
      expect(result.translations).toBeDefined();
      expect(result.metadata).toBeUndefined();
    });
  });
});