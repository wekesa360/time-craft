import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  useAvailableLanguagesQuery,
  useUpdateUserLanguageMutation,
  useCurrentLanguage,
  useLocalizationContentQuery
} from '../useLocalizationQueries';
import * as localizationApi from '../../../api/localization';
import i18n from '../../../i18n';

// Mock the API functions
vi.mock('../../../api/localization');

const mockLocalizationApi = vi.mocked(localizationApi);

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false }
  }
});

const TestWrapper: React.FC<{ children: React.ReactNode; queryClient?: QueryClient }> = ({ 
  children, 
  queryClient = createTestQueryClient() 
}) => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </QueryClientProvider>
);

describe('Localization Queries Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    i18n.changeLanguage('en');
  });

  afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  describe('useAvailableLanguagesQuery Integration', () => {
    it('fetches and caches available languages', async () => {
      const mockLanguages = [
        { code: 'en', name: 'English', nativeName: 'English', coverage: 100 },
        { code: 'de', name: 'German', nativeName: 'Deutsch', coverage: 95 }
      ];

      mockLocalizationApi.fetchAvailableLanguages.mockResolvedValue(mockLanguages);

      const { result } = renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockLanguages);
      expect(mockLocalizationApi.fetchAvailableLanguages).toHaveBeenCalledTimes(1);

      // Second hook should use cached data
      const { result: result2 } = renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      expect(result2.current.data).toEqual(mockLanguages);
      expect(mockLocalizationApi.fetchAvailableLanguages).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('handles API errors and provides fallback', async () => {
      mockLocalizationApi.fetchAvailableLanguages.mockRejectedValue(
        new Error('API Error')
      );

      const { result } = renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.data).toBeUndefined();
    });

    it('refetches data when cache is invalidated', async () => {
      const initialLanguages = [
        { code: 'en', name: 'English', nativeName: 'English' }
      ];
      const updatedLanguages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' }
      ];

      mockLocalizationApi.fetchAvailableLanguages
        .mockResolvedValueOnce(initialLanguages)
        .mockResolvedValueOnce(updatedLanguages);

      const { result } = renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(initialLanguages);
      });

      // Invalidate and refetch
      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: ['localization', 'languages'] });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedLanguages);
      });

      expect(mockLocalizationApi.fetchAvailableLanguages).toHaveBeenCalledTimes(2);
    });

    it('handles concurrent requests correctly', async () => {
      const mockLanguages = [
        { code: 'en', name: 'English', nativeName: 'English' }
      ];

      mockLocalizationApi.fetchAvailableLanguages.mockResolvedValue(mockLanguages);

      // Start multiple hooks simultaneously
      const { result: result1 } = renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      const { result: result2 } = renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(result1.current.data).toEqual(mockLanguages);
      expect(result2.current.data).toEqual(mockLanguages);
      expect(mockLocalizationApi.fetchAvailableLanguages).toHaveBeenCalledTimes(1); // Deduplication
    });
  });

  describe('useUpdateUserLanguageMutation Integration', () => {
    it('updates user language and invalidates related queries', async () => {
      const mockResponse = {
        success: true,
        language: 'de',
        user: { id: '123', language: 'de', updatedAt: '2024-01-01T00:00:00Z' }
      };

      mockLocalizationApi.updateUserLanguage.mockResolvedValue(mockResponse);

      const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateUserLanguageMutation(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await act(async () => {
        await result.current.mutateAsync('de');
      });

      expect(mockLocalizationApi.updateUserLanguage).toHaveBeenCalledWith('de');
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['user', 'language']
      });
    });

    it('handles mutation errors correctly', async () => {
      const error = new Error('Update failed');
      mockLocalizationApi.updateUserLanguage.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateUserLanguageMutation(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await expect(
        act(async () => {
          await result.current.mutateAsync('de');
        })
      ).rejects.toThrow('Update failed');

      expect(result.current.error).toEqual(error);
    });

    it('calls success callback on successful update', async () => {
      const mockResponse = { success: true, language: 'de' };
      const onSuccess = vi.fn();

      mockLocalizationApi.updateUserLanguage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateUserLanguageMutation({
        onSuccess
      }), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await act(async () => {
        await result.current.mutateAsync('de');
      });

      expect(onSuccess).toHaveBeenCalledWith(mockResponse, 'de', undefined);
    });

    it('calls error callback on failed update', async () => {
      const error = new Error('Update failed');
      const onError = vi.fn();

      mockLocalizationApi.updateUserLanguage.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateUserLanguageMutation({
        onError
      }), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await act(async () => {
        try {
          await result.current.mutateAsync('de');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(onError).toHaveBeenCalledWith(error, 'de', undefined);
    });

    it('handles optimistic updates', async () => {
      const mockResponse = { success: true, language: 'de' };
      mockLocalizationApi.updateUserLanguage.mockResolvedValue(mockResponse);

      // Pre-populate cache with user data
      queryClient.setQueryData(['user', 'language'], { language: 'en' });

      const { result } = renderHook(() => useUpdateUserLanguageMutation({
        onMutate: async (newLanguage) => {
          // Optimistic update
          const previousData = queryClient.getQueryData(['user', 'language']);
          queryClient.setQueryData(['user', 'language'], { language: newLanguage });
          return { previousData };
        },
        onError: (err, newLanguage, context) => {
          // Rollback on error
          if (context?.previousData) {
            queryClient.setQueryData(['user', 'language'], context.previousData);
          }
        }
      }), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Check optimistic update
      act(() => {
        result.current.mutate('de');
      });

      expect(queryClient.getQueryData(['user', 'language'])).toEqual({ language: 'de' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useLocalizationContentQuery Integration', () => {
    it('fetches localization content for specific language', async () => {
      const mockContent = {
        translations: {
          'common.save': 'Speichern',
          'common.cancel': 'Abbrechen'
        },
        metadata: {
          language: 'de',
          coverage: 95,
          lastUpdated: '2024-01-01T00:00:00Z'
        }
      };

      mockLocalizationApi.fetchLocalizationContent.mockResolvedValue(mockContent);

      const { result } = renderHook(() => useLocalizationContentQuery('de'), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockContent);
      expect(mockLocalizationApi.fetchLocalizationContent).toHaveBeenCalledWith('de');
    });

    it('caches content by language', async () => {
      const germanContent = {
        translations: { 'test': 'Test' },
        metadata: { language: 'de', coverage: 95, lastUpdated: '2024-01-01' }
      };

      const englishContent = {
        translations: { 'test': 'Test' },
        metadata: { language: 'en', coverage: 100, lastUpdated: '2024-01-01' }
      };

      mockLocalizationApi.fetchLocalizationContent
        .mockResolvedValueOnce(germanContent)
        .mockResolvedValueOnce(englishContent);

      // Fetch German content
      const { result: germanResult } = renderHook(() => useLocalizationContentQuery('de'), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(germanResult.current.isSuccess).toBe(true);
      });

      // Fetch English content
      const { result: englishResult } = renderHook(() => useLocalizationContentQuery('en'), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(englishResult.current.isSuccess).toBe(true);
      });

      expect(germanResult.current.data).toEqual(germanContent);
      expect(englishResult.current.data).toEqual(englishContent);
      expect(mockLocalizationApi.fetchLocalizationContent).toHaveBeenCalledTimes(2);

      // Third call for German should use cache
      const { result: germanResult2 } = renderHook(() => useLocalizationContentQuery('de'), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      expect(germanResult2.current.data).toEqual(germanContent);
      expect(mockLocalizationApi.fetchLocalizationContent).toHaveBeenCalledTimes(2); // Still only 2 calls
    });

    it('disables query when language is empty', () => {
      const { result } = renderHook(() => useLocalizationContentQuery(''), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockLocalizationApi.fetchLocalizationContent).not.toHaveBeenCalled();
    });

    it('handles content fetch errors', async () => {
      mockLocalizationApi.fetchLocalizationContent.mockRejectedValue(
        new Error('Content not found')
      );

      const { result } = renderHook(() => useLocalizationContentQuery('fr'), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('Cross-Query Integration', () => {
    it('coordinates between language list and content queries', async () => {
      const mockLanguages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' }
      ];

      const mockContent = {
        translations: { 'test': 'Test' },
        metadata: { language: 'de', coverage: 95, lastUpdated: '2024-01-01' }
      };

      mockLocalizationApi.fetchAvailableLanguages.mockResolvedValue(mockLanguages);
      mockLocalizationApi.fetchLocalizationContent.mockResolvedValue(mockContent);

      // Fetch languages first
      const { result: languagesResult } = renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(languagesResult.current.isSuccess).toBe(true);
      });

      // Then fetch content for available language
      const availableLanguage = languagesResult.current.data?.[1]?.code; // 'de'
      
      const { result: contentResult } = renderHook(() => useLocalizationContentQuery(availableLanguage!), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(contentResult.current.isSuccess).toBe(true);
      });

      expect(contentResult.current.data).toEqual(mockContent);
    });

    it('handles language update with content refetch', async () => {
      const updateResponse = { success: true, language: 'de' };
      const newContent = {
        translations: { 'test': 'Test auf Deutsch' },
        metadata: { language: 'de', coverage: 95, lastUpdated: '2024-01-01' }
      };

      mockLocalizationApi.updateUserLanguage.mockResolvedValue(updateResponse);
      mockLocalizationApi.fetchLocalizationContent.mockResolvedValue(newContent);

      const { result: mutationResult } = renderHook(() => useUpdateUserLanguageMutation({
        onSuccess: () => {
          // Invalidate content queries when language changes
          queryClient.invalidateQueries({ queryKey: ['localization', 'content'] });
        }
      }), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      const { result: contentResult } = renderHook(() => useLocalizationContentQuery('de'), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Update language
      await act(async () => {
        await mutationResult.current.mutateAsync('de');
      });

      // Content should be refetched
      await waitFor(() => {
        expect(contentResult.current.data).toEqual(newContent);
      });
    });
  });

  describe('Performance and Caching', () => {
    it('implements proper cache invalidation strategies', async () => {
      const mockLanguages = [{ code: 'en', name: 'English', nativeName: 'English' }];
      mockLocalizationApi.fetchAvailableLanguages.mockResolvedValue(mockLanguages);

      const { result } = renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check cache
      const cachedData = queryClient.getQueryData(['localization', 'languages']);
      expect(cachedData).toEqual(mockLanguages);

      // Invalidate specific query
      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: ['localization', 'languages'] });
      });

      // Should trigger refetch
      await waitFor(() => {
        expect(mockLocalizationApi.fetchAvailableLanguages).toHaveBeenCalledTimes(2);
      });
    });

    it('handles stale-while-revalidate correctly', async () => {
      const initialData = [{ code: 'en', name: 'English', nativeName: 'English' }];
      const updatedData = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' }
      ];

      mockLocalizationApi.fetchAvailableLanguages
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(updatedData);

      // Set initial cache
      queryClient.setQueryData(['localization', 'languages'], initialData);

      const { result } = renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Should immediately return cached data
      expect(result.current.data).toEqual(initialData);
      expect(result.current.isLoading).toBe(false);

      // Should trigger background refetch
      await waitFor(() => {
        expect(result.current.data).toEqual(updatedData);
      });
    });
  });
});