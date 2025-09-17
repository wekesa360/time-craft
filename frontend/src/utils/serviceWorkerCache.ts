/**
 * Service Worker Cache Integration
 * Provides interface to communicate with the caching service worker
 */

export class ServiceWorkerCacheManager {
  private static instance: ServiceWorkerCacheManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  static getInstance(): ServiceWorkerCacheManager {
    if (!ServiceWorkerCacheManager.instance) {
      ServiceWorkerCacheManager.instance = new ServiceWorkerCacheManager();
    }
    return ServiceWorkerCacheManager.instance;
  }

  /**
   * Register the service worker
   */
  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw-cache.js', {
        scope: '/'
      });

      console.log('Translation cache service worker registered:', this.registration.scope);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New translation cache service worker available');
              // Optionally notify user about update
              this.notifyUpdate();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to register translation cache service worker:', error);
      return false;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Translation cache service worker unregistered');
      return result;
    } catch (error) {
      console.error('Failed to unregister service worker:', error);
      return false;
    }
  }

  /**
   * Clear translation cache via service worker
   */
  async clearTranslationCache(): Promise<boolean> {
    return this.sendMessage('CLEAR_TRANSLATION_CACHE');
  }

  /**
   * Preload translations for specified languages
   */
  async preloadTranslations(languages: string[]): Promise<boolean> {
    return this.sendMessage('PRELOAD_TRANSLATIONS', { languages });
  }

  /**
   * Get cache size from service worker
   */
  async getCacheSize(): Promise<number> {
    const response = await this.sendMessage('GET_CACHE_SIZE');
    return response?.size || 0;
  }

  /**
   * Invalidate translation for specific language
   */
  async invalidateTranslation(language: string): Promise<boolean> {
    return this.sendMessage('INVALIDATE_TRANSLATION', { language });
  }

  /**
   * Send message to service worker
   */
  private async sendMessage(type: string, data?: any): Promise<any> {
    if (!this.registration || !navigator.serviceWorker.controller) {
      console.warn('Service worker not available');
      return false;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type, data },
        [messageChannel.port2]
      );

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Service worker message timeout'));
      }, 10000);
    });
  }

  /**
   * Notify about service worker update
   */
  private notifyUpdate(): void {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { type: 'translation-cache' }
    }));
  }

  /**
   * Check if service worker is supported
   */
  isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get service worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Export singleton instance
export const serviceWorkerCache = ServiceWorkerCacheManager.getInstance();

// Utility functions
export const registerCacheServiceWorker = () => {
  return serviceWorkerCache.register();
};

export const clearServiceWorkerCache = () => {
  return serviceWorkerCache.clearTranslationCache();
};

export const preloadTranslationsInServiceWorker = (languages: string[]) => {
  return serviceWorkerCache.preloadTranslations(languages);
};

export const getServiceWorkerCacheSize = () => {
  return serviceWorkerCache.getCacheSize();
};