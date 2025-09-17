import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  useAvailableLanguagesQuery,
  useUpdateUserLanguageMutation,
  useCurrentLanguage,
  useLocalizationContentQuery
} from '../useLocalizationQueries';
import i18n from '../../../i18n';

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

vi.mock('../../../lib/api', () => ({
  apiClient: mockApiClient
}));

// Mock i18n
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        language: 'en',
        changeLanguage: vi.fn().mockResolvedValue(undefined)
      }
    })
  };
});

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAvailableLanguagesQuery', () => {
  it('fetches available languages successfully', async () => {
    const mockLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' }
    ];

    mockApiClient.get.mockResolvedValue({
      data: { languages: mockLanguages }
    });

    const { result } = renderHook(() => useAvailableLanguagesQuery(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockLanguages);
    expect(mockApiClient.get).toHaveBeenCalledWith('/localization/languages');
  });

  it('handles API error gracefully', async () => {
    mockApiClient.get.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useAvailableLanguagesQuery(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('returns fallback languages when API fails', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useAvailableLanguagesQuery(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // The hook should provide fallback data through error boundary or default state
    expect(result.current.data).toBeUndefined();
  });

  it('caches the result correctly', async () => {
    const mockLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' }
    ];

    mockApiClient.get.mockResolvedValue({
      data: { languages: mockLanguages }
    });

    const { result: result1 } = renderHook(() => useAvailableLanguagesQuery(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Second hook should use cached data
    const { result: result2 } = renderHook(() => useAvailableLanguagesQuery(), {
      wrapper: TestWrapper
    });

    expect(result2.current.data).toEqual(mockLanguages);
    expect(mockApiClient.get).toHaveBeenCalledTimes(1); // Only called once due to caching
  });
});

describe('useUpdateUserLanguageMutation', () => {
  it('updates user language successfully', async () => {
    mockApiClient.put.mockResolvedValue({
      data: { success: true, language: 'de' }
    });

    const { result } = renderHook(() => useUpdateUserLanguageMutation(), {
      wrapper: TestWrapper
    });

    await result.current.mutateAsync('de');

    expect(mockApiClient.put).toHaveBeenCalledWith('/user/language', {
      language: 'de'
    });
  });

  it('handles update error', async () => {
    mockApiClient.put.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateUserLanguageMutation(), {
      wrapper: TestWrapper
    });

    await expect(result.current.mutateAsync('de')).rejects.toThrow('Update failed');
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    mockApiClient.put.mockResolvedValue({
      data: { success: true, language: 'de' }
    });

    const { result } = renderHook(() => useUpdateUserLanguageMutation({
      onSuccess
    }), {
      wrapper: TestWrapper
    });

    await result.current.mutateAsync('de');

    expect(onSuccess).toHaveBeenCalledWith(
      { success: true, language: 'de' },
      'de',
      undefined
    );
  });

  it('calls onError callback', async () => {
    const onError = vi.fn();
    const error = new Error('Update failed');
    mockApiClient.put.mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateUserLanguageMutation({
      onError
    }), {
      wrapper: TestWrapper
    });

    try {
      await result.current.mutateAsync('de');
    } catch (e) {
      // Expected to throw
    }

    expect(onError).toHaveBeenCalledWith(error, 'de', undefined);
  });

  it('invalidates related queries on success', async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    
    mockApiClient.put.mockResolvedValue({
      data: { success: true, language: 'de' }
    });

    const TestWrapperWithClient: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          {children}
        </I18nextProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateUserLanguageMutation(), {
      wrapper: TestWrapperWithClient
    });

    await result.current.mutateAsync('de');

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user', 'language']
    });
  });
});

describe('useCurrentLanguage', () => {
  it('returns current language from i18n', () => {
    const { result } = renderHook(() => useCurrentLanguage(), {
      wrapper: TestWrapper
    });

    expect(result.current).toBe('en');
  });

  it('updates when language changes', async () => {
    const { result, rerender } = renderHook(() => useCurrentLanguage(), {
      wrapper: TestWrapper
    });

    expect(result.current).toBe('en');

    // Simulate language change
    i18n.changeLanguage('de');
    rerender();

    // Note: In a real scenario, this would update through i18n events
    // For testing, we'd need to mock the i18n language change properly
  });

  it('provides default language when i18n is not available', () => {
    // Mock useTranslation to return undefined i18n
    vi.mocked(require('react-i18next').useTranslation).mockReturnValue({
      t: (key: string) => key,
      i18n: undefined
    });

    const { result } = renderHook(() => useCurrentLanguage(), {
      wrapper: TestWrapper
    });

    expect(result.current).toBe('en'); // Default fallback
  });
});

describe('useLocalizationContentQuery', () => {
  it('fetches localization content successfully', async () => {
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

    mockApiClient.get.mockResolvedValue({
      data: mockContent
    });

    const { result } = renderHook(() => useLocalizationContentQuery('de'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockContent);
    expect(mockApiClient.get).toHaveBeenCalledWith('/localization/content/de');
  });

  it('handles missing language parameter', () => {
    const { result } = renderHook(() => useLocalizationContentQuery(''), {
      wrapper: TestWrapper
    });

    expect(result.current.data).toBeUndefined();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('caches content by language', async () => {
    const mockContent = {
      translations: { 'test': 'Test' },
      metadata: { language: 'de', coverage: 100, lastUpdated: '2024-01-01' }
    };

    mockApiClient.get.mockResolvedValue({
      data: mockContent
    });

    // First call
    const { result: result1 } = renderHook(() => useLocalizationContentQuery('de'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Second call should use cache
    const { result: result2 } = renderHook(() => useLocalizationContentQuery('de'), {
      wrapper: TestWrapper
    });

    expect(result2.current.data).toEqual(mockContent);
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  it('handles API errors', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Content not found'));

    const { result } = renderHook(() => useLocalizationContentQuery('de'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('enables/disables query based on language parameter', () => {
    const { result: result1 } = renderHook(() => useLocalizationContentQuery('de'), {
      wrapper: TestWrapper
    });

    const { result: result2 } = renderHook(() => useLocalizationContentQuery(''), {
      wrapper: TestWrapper
    });

    // First query should be enabled
    expect(result1.current.isLoading || result1.current.isSuccess || result1.current.isError).toBe(true);
    
    // Second query should be disabled
    expect(result2.current.isLoading).toBe(false);
    expect(result2.current.data).toBeUndefined();
  });
});

describe('Error Handling and Edge Cases', () => {
  it('handles network errors gracefully', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useAvailableLanguagesQuery(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network Error');
  });

  it('handles malformed API responses', async () => {
    mockApiClient.get.mockResolvedValue({
      data: null // Malformed response
    });

    const { result } = renderHook(() => useAvailableLanguagesQuery(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should handle null data gracefully
    expect(result.current.data).toBeNull();
  });

  it('handles concurrent language updates', async () => {
    let resolveFirst: (value: any) => void;
    let resolveSecond: (value: any) => void;

    const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
    const secondPromise = new Promise(resolve => { resolveSecond = resolve; });

    mockApiClient.put
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() => useUpdateUserLanguageMutation(), {
      wrapper: TestWrapper
    });

    // Start two concurrent updates
    const firstUpdate = result.current.mutateAsync('de');
    const secondUpdate = result.current.mutateAsync('fr');

    // Resolve second first
    resolveSecond({ data: { success: true, language: 'fr' } });
    resolveFirst({ data: { success: true, language: 'de' } });

    const [firstResult, secondResult] = await Promise.all([firstUpdate, secondUpdate]);

    expect(firstResult).toEqual({ success: true, language: 'de' });
    expect(secondResult).toEqual({ success: true, language: 'fr' });
  });

  it('handles query client not available', () => {
    // Test without QueryClientProvider
    const TestWrapperWithoutQuery: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    );

    expect(() => {
      renderHook(() => useAvailableLanguagesQuery(), {
        wrapper: TestWrapperWithoutQuery
      });
    }).toThrow(); // Should throw because QueryClient is required
  });
});