import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { TranslationCacheManager, translationCache } from '../translationCache';

// Mock localStorage
const mockStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage.data[key];
  }),
  clear: vi.fn(() => {
    mockStorage.data = {};
  }),
  get length() {
    return Object.keys(mockStorage.data).length;
  },
  key: vi.fn((index: number) => Object.keys(mockStorage.data)[index] || null)
};

// Mock lz-string
vi.mock('lz-string', () => ({
  compress: vi.fn((data: string) => `compressed_${data}`),
  decompress: vi.fn((data: string) => data.replace('compressed_', ''))
}));

describe('TranslationCacheManager', () => {
  let cacheManager: TranslationCacheManager;
  
  beforeEach(() => {
    // Reset mock storage
    mockStorage.data = {};
    vi.clearAllMocks();
    
    // Reset singleton instance
    (TranslationCacheManager as any).instance = undefined;
    
    // Create new cache manager instance with mock storage
    cacheManager = new TranslationCacheManager({
      maxAge: 60000, // 1 minute for testing
      maxSize: 1024 * 1024, // 1MB
      compressionThreshold: 100,
      enableCompression: true,
      enableVersioning: true,
      storagePrefix: 'test_cache_'
    }, mockStorage as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve translation data', async () => {
      const testData = { hello: 'Hallo', world: 'Welt' };
      const metadata = {
        language: 'de',
        version: '1.0.0',
        coverage: 100
      };

      await cacheManager.set('de', testData, metadata);
      const cached = await cacheManager.get('de', '1.0.0');

      expect(cached).toBeTruthy();
      expect(cached?.data).toEqual(testData);
      expect(cached?.metadata.language).toBe('de');
      expect(cached?.metadata.version).toBe('1.0.0');
    });

    it('should return null for non-existent cache entries', async () => {
      const cached = await cacheManager.get('nonexistent');
      expect(cached).toBeNull();
    });

    it('should remove cached translations', async () => {
      const testData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', testData, metadata);
      cacheManager.remove('de', '1.0.0');
      
      const cached = await cacheManager.get('de', '1.0.0');
      expect(cached).toBeNull();
    });

    it('should clear all cached translations', async () => {
      const testData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', testData, metadata);
      await cacheManager.set('en', testData, metadata);
      
      cacheManager.clear();
      
      const cachedDe = await cacheManager.get('de');
      const cachedEn = await cacheManager.get('en');
      
      expect(cachedDe).toBeNull();
      expect(cachedEn).toBeNull();
    });
  });

  describe('Cache Expiration', () => {
    it('should return null for expired cache entries', async () => {
      const testData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', testData, metadata);
      
      // Mock expired timestamp
      const cacheKey = 'test_cache_de_v1.0.0';
      const storedData = JSON.parse(mockStorage.data[cacheKey]);
      storedData.metadata.timestamp = Date.now() - 120000; // 2 minutes ago
      mockStorage.data[cacheKey] = JSON.stringify(storedData);
      
      const cached = await cacheManager.get('de', '1.0.0');
      expect(cached).toBeNull();
    });

    it('should clear expired entries', async () => {
      const testData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', testData, metadata);
      await cacheManager.set('en', testData, metadata);
      
      // Make one entry expired
      const cacheKey = 'test_cache_de_v1.0.0';
      const storedData = JSON.parse(mockStorage.data[cacheKey]);
      storedData.metadata.timestamp = Date.now() - 120000;
      mockStorage.data[cacheKey] = JSON.stringify(storedData);
      
      cacheManager.clearExpired();
      
      const cachedDe = await cacheManager.get('de', '1.0.0');
      const cachedEn = await cacheManager.get('en', '1.0.0');
      
      expect(cachedDe).toBeNull();
      expect(cachedEn).toBeTruthy();
    });
  });

  describe('Compression', () => {
    it('should compress large data', async () => {
      const largeData = Array.from({ length: 200 }, (_, i) => [`key${i}`, `value${i}`])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', largeData, metadata);
      
      // Check that compression was applied
      const cacheKey = 'test_cache_de_v1.0.0';
      const storedData = JSON.parse(mockStorage.data[cacheKey]);
      expect(storedData.metadata.compressed).toBe(true);
    });

    it('should not compress small data', async () => {
      const smallData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', smallData, metadata);
      
      const cacheKey = 'test_cache_de_v1.0.0';
      const storedData = JSON.parse(mockStorage.data[cacheKey]);
      expect(storedData.metadata.compressed).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      const testData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      // Miss
      await cacheManager.get('de');
      
      // Store and hit
      await cacheManager.set('de', testData, metadata);
      await cacheManager.get('de');
      
      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should calculate total cache size', async () => {
      const testData = { hello: 'Hallo', world: 'Welt' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', testData, metadata);
      
      const stats = cacheManager.getStats();
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.itemCount).toBe(1);
    });
  });

  describe('Cache Integrity', () => {
    it('should validate cache integrity', async () => {
      const testData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', testData, metadata);
      
      // Add corrupted entry
      mockStorage.data['test_cache_corrupted'] = 'invalid json';
      
      // Add expired entry
      const expiredKey = 'test_cache_expired_v1.0.0';
      const expiredData = {
        data: testData,
        metadata: {
          ...metadata,
          timestamp: Date.now() - 120000 // 2 minutes ago
        }
      };
      mockStorage.data[expiredKey] = JSON.stringify(expiredData);
      
      const integrity = cacheManager.validateIntegrity();
      
      expect(integrity.valid).toBe(1);
      expect(integrity.corrupted).toBe(1);
      expect(integrity.expired).toBe(1);
      expect(integrity.total).toBe(3);
    });
  });

  describe('Preloading', () => {
    it('should preload translations for multiple languages', async () => {
      const mockFetchFn = vi.fn()
        .mockResolvedValueOnce({
          data: { hello: 'Hello' },
          metadata: { language: 'en', version: '1.0.0', coverage: 100 }
        })
        .mockResolvedValueOnce({
          data: { hello: 'Hallo' },
          metadata: { language: 'de', version: '1.0.0', coverage: 100 }
        });

      await cacheManager.preload(['en', 'de'], mockFetchFn);

      expect(mockFetchFn).toHaveBeenCalledTimes(2);
      
      const cachedEn = await cacheManager.get('en');
      const cachedDe = await cacheManager.get('de');
      
      expect(cachedEn?.data).toEqual({ hello: 'Hello' });
      expect(cachedDe?.data).toEqual({ hello: 'Hallo' });
    });

    it('should skip preloading for already cached languages', async () => {
      const testData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', testData, metadata);

      const mockFetchFn = vi.fn();
      await cacheManager.preload(['de'], mockFetchFn);

      expect(mockFetchFn).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Updates', () => {
    it('should update cache configuration', () => {
      const newConfig = {
        maxAge: 120000,
        enableCompression: false
      };

      cacheManager.updateConfig(newConfig);

      // Test that new config is applied by checking compression behavior
      expect(cacheManager['config'].maxAge).toBe(120000);
      expect(cacheManager['config'].enableCompression).toBe(false);
    });
  });

  describe('Memory Cache', () => {
    it('should use memory cache for faster access', async () => {
      const testData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await cacheManager.set('de', testData, metadata);
      
      // First access should populate memory cache
      await cacheManager.get('de');
      
      // Clear persistent storage but keep memory cache
      mockStorage.clear();
      
      // Should still get data from memory cache
      const cached = await cacheManager.get('de');
      expect(cached?.data).toEqual(testData);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      mockStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      const testData = { hello: 'Hallo' };
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      await expect(cacheManager.set('de', testData, metadata)).rejects.toThrow('Storage full');
    });

    it('should handle corrupted cache entries', async () => {
      // Add corrupted entry
      mockStorage.data['test_cache_de_v1.0.0'] = 'invalid json';

      const cached = await cacheManager.get('de', '1.0.0');
      expect(cached).toBeNull();
    });

    it('should handle compression errors', async () => {
      const { compress } = await import('lz-string');
      (compress as Mock).mockImplementationOnce(() => {
        throw new Error('Compression failed');
      });

      const testData = Array.from({ length: 200 }, (_, i) => [`key${i}`, `value${i}`])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

      // Should not throw, should store uncompressed
      await expect(cacheManager.set('de', testData, metadata)).resolves.not.toThrow();
      
      const cached = await cacheManager.get('de');
      expect(cached?.data).toEqual(testData);
      expect(cached?.metadata.compressed).toBe(false);
    });
  });
});

describe('Singleton Instance', () => {
  it('should return the same instance', () => {
    const instance1 = TranslationCacheManager.getInstance();
    const instance2 = TranslationCacheManager.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should use the exported singleton', () => {
    expect(translationCache).toBeInstanceOf(TranslationCacheManager);
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    mockStorage.data = {};
    vi.clearAllMocks();
  });

  it('should provide utility functions for common operations', async () => {
    const { getCachedTranslation, setCachedTranslation, clearTranslationCache } = await import('../translationCache');
    
    const testData = { hello: 'Hallo' };
    const metadata = { language: 'de', version: '1.0.0', coverage: 100 };

    await setCachedTranslation('de', testData, metadata);
    const cached = await getCachedTranslation('de', '1.0.0');
    
    expect(cached?.data).toEqual(testData);
    
    clearTranslationCache();
    const clearedCache = await getCachedTranslation('de', '1.0.0');
    expect(clearedCache).toBeNull();
  });
});