import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTranslationCache, useCachedTranslations, useCachePerformance, useCacheWarming } from '../useTranslationCache';

// Mock the translation cache
vi.mock('../../utils/translationCache', () => ({
  translationCache: {
    updateConfig: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    clearExpired: vi.fn(),
    preload: vi.fn(),
    validateIntegrity: vi.fn(),
    getStats: vi.fn()
  },
  getTranslationCacheStats: vi.fn(),
  clearTranslationCache: vi.fn()
}));

// Mock the localization API
vi.mock('../../api/localization', () => ({
  fetchLocalizationContent: vi.fn()
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' }
  })
}));

describe('useTranslationCache', () => {
  const mockStats = {
    hits: 10,
    misses: 5,
    hitRate: 0.67,
    evictions: 2,
    compressionRatio: 0.8,
    totalSize: 1024,
    itemCount: 3,
    memoryItems: 2
  };

  const mockIntegrity = {
    valid: 3,
    corrupted: 0,
    expired: 1,
    total: 4
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const { getTranslationCacheStats } = require('../../utils/translationCache');
    const { translationCache } = require('../../utils/translationCache');
    
    getTranslationCacheStats.mockReturnValue(mockStats);
    translationCache.validateIntegrity.mockReturnValue(mockIntegrity);
  });

  it('should initialize with stats and integrity data', async () => {
    const { result } = renderHook(() => useTranslationCache());

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.integrity).toEqual(mockIntegrity);
    });
  });

  it('should refresh stats when requested', async () => {
    const { result } = renderHook(() => useTranslationCache());
    const { getTranslationCacheStats } = require('../../utils/translationCache');

    const newStats = { ...mockStats, hits: 15 };
    getTranslationCacheStats.mockReturnValue(newStats);

    act(() => {
      result.current.refreshStats();
    });

    await waitFor(() => {
      expect(result.current.stats).toEqual(newStats);
    });
  });

  it('should clear cache and refresh stats', async () => {
    const { result } = renderHook(() => useTranslationCache());
    const { clearTranslationCache } = require('../../utils/translationCache');

    act(() => {
      result.current.clearCache();
    });

    expect(clearTranslationCache).toHaveBeenCalled();
  });

  it('should clear expired entries', async () => {
    const { result } = renderHook(() => useTranslationCache());
    const { translationCache } = require('../../utils/translationCache');

    act(() => {
      result.current.clearExpired();
    });

    expect(translationCache.clearExpired).toHaveBeenCalled();
  });

  it('should preload languages', async () => {
    const { result } = renderHook(() => useTranslationCache());
    const { translationCache } = require('../../utils/translationCache');
    const { fetchLocalizationContent } = require('../../api/localization');

    fetchLocalizationContent.mockResolvedValue({
      translations: { hello: 'Hello' },
      metadata: { version: '1.0.0', coverage: 100 }
    });

    translationCache.preload.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.preloadLanguages(['en', 'de']);
    });

    expect(translationCache.preload).toHaveBeenCalledWith(['en', 'de'], expect.any(Function));
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle preload errors', async () => {
    const { result } = renderHook(() => useTranslationCache());
    const { translationCache } = require('../../utils/translationCache');

    translationCache.preload.mockRejectedValue(new Error('Preload failed'));

    await act(async () => {
      await expect(result.current.preloadLanguages(['en'])).rejects.toThrow('Preload failed');
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should get cached translation', async () => {
    const { result } = renderHook(() => useTranslationCache());
    const { translationCache } = require('../../utils/translationCache');

    const mockCachedData = {
      data: { hello: 'Hello' },
      metadata: { language: 'en', version: '1.0.0', coverage: 100, timestamp: Date.now(), compressed: false, size: 100 }
    };

    translationCache.get.mockResolvedValue(mockCachedData);

    let cachedData;
    await act(async () => {
      cachedData = await result.current.getCachedTranslation('en', '1.0.0');
    });

    expect(cachedData).toEqual(mockCachedData);
    expect(translationCache.get).toHaveBeenCalledWith('en', '1.0.0');
  });

  it('should remove cached translation', async () => {
    const { result } = renderHook(() => useTranslationCache());
    const { translationCache } = require('../../utils/translationCache');

    act(() => {
      result.current.removeCachedTranslation('en', '1.0.0');
    });

    expect(translationCache.remove).toHaveBeenCalledWith('en', '1.0.0');
  });

  it('should update config when provided', () => {
    const config = { maxAge: 60000, enableCompression: false };
    const { translationCache } = require('../../utils/translationCache');

    renderHook(() => useTranslationCache(config));

    expect(translationCache.updateConfig).toHaveBeenCalledWith(config);
  });
});

describe('useCachedTranslations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load translations from cache first', async () => {
    const { translationCache } = require('../../utils/translationCache');
    const mockCachedData = {
      data: { hello: 'Hello' },
      metadata: { language: 'en', version: '1.0.0', coverage: 100, timestamp: Date.now(), compressed: false, size: 100 }
    };

    translationCache.get.mockResolvedValue(mockCachedData);

    const { result } = renderHook(() => useCachedTranslations('en', '1.0.0'));

    await waitFor(() => {
      expect(result.current.translations).toEqual({ hello: 'Hello' });
      expect(result.current.fromCache).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should fetch from API when not cached', async () => {
    const { translationCache } = require('../../utils/translationCache');
    const { fetchLocalizationContent } = require('../../api/localization');

    translationCache.get.mockResolvedValue(null);
    fetchLocalizationContent.mockResolvedValue({
      translations: { hello: 'Hello' },
      metadata: { version: '1.0.0', coverage: 100 }
    });
    translationCache.set.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCachedTranslations('en', '1.0.0'));

    await waitFor(() => {
      expect(result.current.translations).toEqual({ hello: 'Hello' });
      expect(result.current.fromCache).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchLocalizationContent).toHaveBeenCalledWith('en');
    expect(translationCache.set).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const { translationCache } = require('../../utils/translationCache');
    const { fetchLocalizationContent } = require('../../api/localization');

    translationCache.get.mockResolvedValue(null);
    fetchLocalizationContent.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useCachedTranslations('en', '1.0.0'));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should not load when language is empty', () => {
    const { result } = renderHook(() => useCachedTranslations('', '1.0.0'));

    expect(result.current.translations).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should provide reload function', async () => {
    const { translationCache } = require('../../utils/translationCache');
    const { fetchLocalizationContent } = require('../../api/localization');

    translationCache.get.mockResolvedValue(null);
    fetchLocalizationContent.mockResolvedValue({
      translations: { hello: 'Hello' },
      metadata: { version: '1.0.0', coverage: 100 }
    });

    const { result } = renderHook(() => useCachedTranslations('en', '1.0.0'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Reset mocks and test reload
    vi.clearAllMocks();
    fetchLocalizationContent.mockResolvedValue({
      translations: { hello: 'Hello Updated' },
      metadata: { version: '1.0.1', coverage: 100 }
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(fetchLocalizationContent).toHaveBeenCalledWith('en');
  });
});

describe('useCachePerformance', () => {
  it('should record load times and calculate metrics', () => {
    const { result } = renderHook(() => useCachePerformance());

    act(() => {
      result.current.recordLoadTime('en', 100, true);
      result.current.recordLoadTime('de', 200, false);
      result.current.recordLoadTime('fr', 150, true);
    });

    const { performanceData } = result.current;
    expect(performanceData.loadTimes).toEqual({
      en: 100,
      de: 200,
      fr: 150
    });
    expect(performanceData.totalRequests).toBe(3);
    expect(performanceData.cacheHitRate).toBeCloseTo(0.67, 2);
    expect(performanceData.averageLoadTime).toBeCloseTo(150, 0);
  });

  it('should reset performance data', () => {
    const { result } = renderHook(() => useCachePerformance());

    act(() => {
      result.current.recordLoadTime('en', 100, true);
      result.current.resetPerformanceData();
    });

    const { performanceData } = result.current;
    expect(performanceData.loadTimes).toEqual({});
    expect(performanceData.totalRequests).toBe(0);
    expect(performanceData.cacheHitRate).toBe(0);
    expect(performanceData.averageLoadTime).toBe(0);
  });
});

describe('useCacheWarming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should warm cache for specified languages', async () => {
    const { translationCache } = require('../../utils/translationCache');
    const { fetchLocalizationContent } = require('../../api/localization');
    const { getTranslationCacheStats } = require('../../utils/translationCache');

    getTranslationCacheStats.mockReturnValue({ itemCount: 0 });
    translationCache.get.mockResolvedValue(null);
    fetchLocalizationContent.mockResolvedValue({
      translations: { hello: 'Hello' },
      metadata: { version: '1.0.0', coverage: 100 }
    });
    translationCache.set.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCacheWarming(['en', 'de']));

    await waitFor(() => {
      expect(result.current.isWarming).toBe(false);
      expect(result.current.warmingProgress).toBe(100);
    });

    expect(fetchLocalizationContent).toHaveBeenCalledTimes(2);
    expect(translationCache.set).toHaveBeenCalledTimes(2);
  });

  it('should skip warming if cache already has items', async () => {
    const { getTranslationCacheStats } = require('../../utils/translationCache');
    const { fetchLocalizationContent } = require('../../api/localization');

    getTranslationCacheStats.mockReturnValue({ itemCount: 5 });

    renderHook(() => useCacheWarming(['en', 'de']));

    // Wait a bit to ensure no warming happens
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(fetchLocalizationContent).not.toHaveBeenCalled();
  });

  it('should handle warming errors gracefully', async () => {
    const { translationCache } = require('../../utils/translationCache');
    const { fetchLocalizationContent } = require('../../api/localization');
    const { getTranslationCacheStats } = require('../../utils/translationCache');

    getTranslationCacheStats.mockReturnValue({ itemCount: 0 });
    translationCache.get.mockResolvedValue(null);
    fetchLocalizationContent.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useCacheWarming(['en']));

    await waitFor(() => {
      expect(result.current.isWarming).toBe(false);
      expect(result.current.warmingError).toBeInstanceOf(Error);
    });
  });

  it('should provide manual warm cache function', async () => {
    const { translationCache } = require('../../utils/translationCache');
    const { fetchLocalizationContent } = require('../../api/localization');

    translationCache.get.mockResolvedValue(null);
    fetchLocalizationContent.mockResolvedValue({
      translations: { hello: 'Hello' },
      metadata: { version: '1.0.0', coverage: 100 }
    });

    const { result } = renderHook(() => useCacheWarming(['en']));

    await act(async () => {
      await result.current.warmCache();
    });

    expect(result.current.warmingProgress).toBe(100);
  });

  it('should update progress during warming', async () => {
    const { translationCache } = require('../../utils/translationCache');
    const { fetchLocalizationContent } = require('../../api/localization');
    const { getTranslationCacheStats } = require('../../utils/translationCache');

    getTranslationCacheStats.mockReturnValue({ itemCount: 0 });
    translationCache.get.mockResolvedValue(null);
    
    // Mock delayed responses to test progress
    fetchLocalizationContent
      .mockImplementationOnce(() => new Promise(resolve => 
        setTimeout(() => resolve({
          translations: { hello: 'Hello' },
          metadata: { version: '1.0.0', coverage: 100 }
        }), 50)
      ))
      .mockImplementationOnce(() => new Promise(resolve => 
        setTimeout(() => resolve({
          translations: { hello: 'Hallo' },
          metadata: { version: '1.0.0', coverage: 100 }
        }), 50)
      ));

    const { result } = renderHook(() => useCacheWarming(['en', 'de']));

    // Check initial state
    expect(result.current.warmingProgress).toBe(0);

    await waitFor(() => {
      expect(result.current.warmingProgress).toBe(100);
    }, { timeout: 200 });
  });
});