/**
 * Translation Cache Manager
 * Handles caching of translation files with compression, versioning, and invalidation
 */

import { compress, decompress } from 'lz-string';

export interface CachedTranslation {
  data: Record<string, string>;
  metadata: {
    language: string;
    version: string;
    timestamp: number;
    coverage: number;
    compressed: boolean;
    size: number;
    originalSize?: number;
  };
}

export interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // in bytes
  compressionThreshold: number; // minimum size to compress
  enableCompression: boolean;
  enableVersioning: boolean;
  storagePrefix: string;
}

export class TranslationCacheManager {
  private static instance: TranslationCacheManager;
  private config: CacheConfig;
  private storage: Storage;
  private memoryCache: Map<string, CachedTranslation> = new Map();
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    compressionRatio: 0
  };

  constructor(config: Partial<CacheConfig> = {}, storage: Storage = localStorage) {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 5 * 1024 * 1024, // 5MB
      compressionThreshold: 1024, // 1KB
      enableCompression: true,
      enableVersioning: true,
      storagePrefix: 'translation_cache_',
      ...config
    };
    this.storage = storage;
  }

  static getInstance(config?: Partial<CacheConfig>, storage?: Storage): TranslationCacheManager {
    if (!TranslationCacheManager.instance) {
      TranslationCacheManager.instance = new TranslationCacheManager(config, storage);
    }
    return TranslationCacheManager.instance;
  }

  /**
   * Get cached translation data
   */
  async get(language: string, version?: string): Promise<CachedTranslation | null> {
    const cacheKey = this.getCacheKey(language, version);
    
    // Check memory cache first
    const memoryResult = this.memoryCache.get(cacheKey);
    if (memoryResult && this.isValid(memoryResult)) {
      this.cacheStats.hits++;
      return memoryResult;
    }

    // Remove invalid memory cache entry
    if (memoryResult && !this.isValid(memoryResult)) {
      this.memoryCache.delete(cacheKey);
    }

    // Check persistent storage
    try {
      const stored = this.storage.getItem(cacheKey);
      if (!stored) {
        this.cacheStats.misses++;
        return null;
      }

      const parsed = JSON.parse(stored) as CachedTranslation;
      
      if (!this.isValid(parsed)) {
        this.remove(language, version);
        this.cacheStats.misses++;
        return null;
      }

      // Decompress if needed
      if (parsed.metadata.compressed) {
        parsed.data = this.decompressData(parsed.data as any);
        parsed.metadata.compressed = false;
      }

      // Store in memory cache for faster access
      this.memoryCache.set(cacheKey, parsed);
      this.cacheStats.hits++;
      
      return parsed;
    } catch (error) {
      console.error('Error reading from translation cache:', error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Store translation data in cache
   */
  async set(
    language: string, 
    data: Record<string, string>, 
    metadata: Omit<CachedTranslation['metadata'], 'timestamp' | 'compressed' | 'size' | 'originalSize'>
  ): Promise<void> {
    const cacheKey = this.getCacheKey(language, metadata.version);
    const originalSize = this.calculateSize(data);
    
    let processedData: Record<string, string> | string = data;
    let compressed = false;
    let finalSize = originalSize;

    // Compress if enabled and data is large enough
    if (this.config.enableCompression && originalSize > this.config.compressionThreshold) {
      try {
        processedData = this.compressData(data);
        compressed = true;
        finalSize = this.calculateSize(processedData);
        
        // Update compression ratio stats
        this.cacheStats.compressionRatio = finalSize / originalSize;
      } catch (error) {
        console.warn('Compression failed, storing uncompressed:', error);
        processedData = data;
      }
    }

    const cachedTranslation: CachedTranslation = {
      data: processedData as any,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        compressed,
        size: finalSize,
        originalSize
      }
    };

    try {
      // Check if we need to make space
      await this.ensureSpace(finalSize);
      
      // Store in persistent storage
      this.storage.setItem(cacheKey, JSON.stringify(cachedTranslation));
      
      // Store in memory cache (uncompressed for faster access)
      const memoryCopy = {
        ...cachedTranslation,
        data: compressed ? this.decompressData(processedData as string) : data,
        metadata: {
          ...cachedTranslation.metadata,
          compressed: false
        }
      };
      this.memoryCache.set(cacheKey, memoryCopy);
      
    } catch (error) {
      console.error('Error storing translation cache:', error);
      throw error;
    }
  }

  /**
   * Remove cached translation
   */
  remove(language: string, version?: string): void {
    const cacheKey = this.getCacheKey(language, version);
    this.storage.removeItem(cacheKey);
    this.memoryCache.delete(cacheKey);
  }

  /**
   * Clear all cached translations
   */
  clear(): void {
    const keys = this.getAllCacheKeys();
    keys.forEach(key => this.storage.removeItem(key));
    this.memoryCache.clear();
  }

  /**
   * Clear expired translations
   */
  clearExpired(): void {
    const keys = this.getAllCacheKeys();
    const now = Date.now();
    
    keys.forEach(key => {
      try {
        const stored = this.storage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as CachedTranslation;
          if (now - parsed.metadata.timestamp > this.config.maxAge) {
            this.storage.removeItem(key);
            this.memoryCache.delete(key);
          }
        }
      } catch (error) {
        // Remove corrupted entries
        this.storage.removeItem(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
    compressionRatio: number;
    totalSize: number;
    itemCount: number;
    memoryItems: number;
  } {
    const totalSize = this.getTotalCacheSize();
    const itemCount = this.getAllCacheKeys().length;
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
    
    return {
      ...this.cacheStats,
      hitRate,
      totalSize,
      itemCount,
      memoryItems: this.memoryCache.size
    };
  }

  /**
   * Check if cached data is valid
   */
  private isValid(cached: CachedTranslation): boolean {
    const now = Date.now();
    const age = now - cached.metadata.timestamp;
    return age < this.config.maxAge;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(language: string, version?: string): string {
    const versionSuffix = this.config.enableVersioning && version ? `_v${version}` : '';
    return `${this.config.storagePrefix}${language}${versionSuffix}`;
  }

  /**
   * Get all cache keys
   */
  private getAllCacheKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.config.storagePrefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Calculate data size in bytes
   */
  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Get total cache size
   */
  private getTotalCacheSize(): number {
    const keys = this.getAllCacheKeys();
    let totalSize = 0;
    
    keys.forEach(key => {
      try {
        const stored = this.storage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as CachedTranslation;
          totalSize += parsed.metadata.size;
        }
      } catch (error) {
        // Ignore corrupted entries
      }
    });
    
    return totalSize;
  }

  /**
   * Ensure there's enough space for new data
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getTotalCacheSize();
    
    if (currentSize + requiredSize <= this.config.maxSize) {
      return;
    }

    // Remove expired items first
    this.clearExpired();
    
    const newSize = this.getTotalCacheSize();
    if (newSize + requiredSize <= this.config.maxSize) {
      return;
    }

    // Use LRU eviction strategy
    await this.evictLRU(requiredSize);
  }

  /**
   * Evict least recently used items
   */
  private async evictLRU(requiredSize: number): Promise<void> {
    const keys = this.getAllCacheKeys();
    const items: { key: string; timestamp: number; size: number }[] = [];
    
    // Collect all items with timestamps
    keys.forEach(key => {
      try {
        const stored = this.storage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as CachedTranslation;
          items.push({
            key,
            timestamp: parsed.metadata.timestamp,
            size: parsed.metadata.size
          });
        }
      } catch (error) {
        // Remove corrupted entries
        this.storage.removeItem(key);
      }
    });

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.timestamp - b.timestamp);
    
    let freedSpace = 0;
    for (const item of items) {
      if (freedSpace >= requiredSize) {
        break;
      }
      
      this.storage.removeItem(item.key);
      this.memoryCache.delete(item.key);
      freedSpace += item.size;
      this.cacheStats.evictions++;
    }
  }

  /**
   * Compress translation data
   */
  private compressData(data: Record<string, string>): string {
    const jsonString = JSON.stringify(data);
    return compress(jsonString);
  }

  /**
   * Decompress translation data
   */
  private decompressData(compressedData: string): Record<string, string> {
    const decompressed = decompress(compressedData);
    if (!decompressed) {
      throw new Error('Failed to decompress translation data');
    }
    return JSON.parse(decompressed);
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Preload translations for multiple languages
   */
  async preload(languages: string[], fetchFn: (lang: string) => Promise<{ data: Record<string, string>; metadata: any }>): Promise<void> {
    const promises = languages.map(async (language) => {
      try {
        const existing = await this.get(language);
        if (!existing) {
          const result = await fetchFn(language);
          if (result && result.data && result.metadata) {
            await this.set(language, result.data, result.metadata);
          }
        }
      } catch (error) {
        console.warn(`Failed to preload translations for ${language}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Validate cache integrity
   */
  validateIntegrity(): {
    valid: number;
    corrupted: number;
    expired: number;
    total: number;
  } {
    const keys = this.getAllCacheKeys();
    const now = Date.now();
    let valid = 0;
    let corrupted = 0;
    let expired = 0;
    
    keys.forEach(key => {
      try {
        const stored = this.storage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as CachedTranslation;
          if (now - parsed.metadata.timestamp > this.config.maxAge) {
            expired++;
          } else {
            valid++;
          }
        }
      } catch (error) {
        corrupted++;
      }
    });
    
    return {
      valid,
      corrupted,
      expired,
      total: keys.length
    };
  }
}

// Export singleton instance
export const translationCache = TranslationCacheManager.getInstance();

// Utility functions
export const getCachedTranslation = (language: string, version?: string) => {
  return translationCache.get(language, version);
};

export const setCachedTranslation = (
  language: string, 
  data: Record<string, string>, 
  metadata: Omit<CachedTranslation['metadata'], 'timestamp' | 'compressed' | 'size' | 'originalSize'>
) => {
  return translationCache.set(language, data, metadata);
};

export const clearTranslationCache = () => {
  translationCache.clear();
};

export const getTranslationCacheStats = () => {
  return translationCache.getStats();
};