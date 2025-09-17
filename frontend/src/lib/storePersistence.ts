/**
 * Store Persistence Utilities
 * Handles offline storage and synchronization for Zustand stores
 */

import type { StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

// Define local persist options type
interface PersistConfig<T> {
  name: string;
  storage?: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T) => ((state?: T, error?: Error) => void) | void;
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
  merge?: (persistedState: any, currentState: T) => T;
}

// IndexedDB utilities for complex data storage
class IndexedDBStorage {
  private dbName = 'timecraft-store';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for different data types
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth');
        }
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks');
        }
        if (!db.objectStoreNames.contains('health')) {
          db.createObjectStore('health');
        }
        if (!db.objectStoreNames.contains('focus')) {
          db.createObjectStore('focus');
        }
        if (!db.objectStoreNames.contains('badges')) {
          db.createObjectStore('badges');
        }
        if (!db.objectStoreNames.contains('social')) {
          db.createObjectStore('social');
        }
        if (!db.objectStoreNames.contains('voice')) {
          db.createObjectStore('voice');
        }
        if (!db.objectStoreNames.contains('calendar')) {
          db.createObjectStore('calendar');
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications');
        }
        if (!db.objectStoreNames.contains('theme')) {
          db.createObjectStore('theme');
        }
        if (!db.objectStoreNames.contains('ui')) {
          db.createObjectStore('ui');
        }
      };
    });
  }

  async getItem(storeName: string, key: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async setItem(storeName: string, key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async removeItem(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Global IndexedDB instance
const indexedDBStorage = new IndexedDBStorage();

// Custom storage interface for different storage types
interface StorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// LocalStorage adapter (for simple data)
const localStorageAdapter: StorageInterface = {
  getItem: async (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Handle quota exceeded or other errors
      console.warn('LocalStorage setItem failed for key:', key);
    }
  },
  removeItem: async (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('LocalStorage removeItem failed for key:', key);
    }
  },
};

// IndexedDB adapter (for complex data)
const indexedDBAdapter = (storeName: string): StorageInterface => ({
  getItem: async (key: string) => {
    try {
      const value = await indexedDBStorage.getItem(storeName, key);
      return value ? JSON.stringify(value) : null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await indexedDBStorage.setItem(storeName, key, JSON.parse(value));
    } catch {
      console.warn('IndexedDB setItem failed for key:', key);
    }
  },
  removeItem: async (key: string) => {
    try {
      await indexedDBStorage.removeItem(storeName, key);
    } catch {
      console.warn('IndexedDB removeItem failed for key:', key);
    }
  },
});

// Persistence configurations for different store types
export const persistenceConfigs = {
  // Simple stores (use localStorage)
  theme: {
    name: 'timecraft-theme',
    storage: localStorageAdapter,
    partialize: (state: any) => ({
      theme: state.theme,
      systemTheme: state.systemTheme,
    }),
  } as PersistConfig<any>,

  ui: {
    name: 'timecraft-ui',
    storage: localStorageAdapter,
    partialize: (state: any) => ({
      sidebarCollapsed: state.sidebarCollapsed,
      viewMode: state.viewMode,
      preferences: state.preferences,
    }),
  } as PersistConfig<any>,

  // Complex stores (use IndexedDB)
  auth: {
    name: 'timecraft-auth',
    storage: indexedDBAdapter('auth'),
    partialize: (state: any) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      preferences: state.preferences,
    }),
  } as PersistConfig<any>,

  tasks: {
    name: 'timecraft-tasks',
    storage: indexedDBAdapter('tasks'),
    partialize: (state: any) => ({
      tasks: state.tasks,
      filters: state.filters,
      viewMode: state.viewMode,
      offlineQueue: state.offlineQueue,
    }),
  } as PersistConfig<any>,

  health: {
    name: 'timecraft-health',
    storage: indexedDBAdapter('health'),
    partialize: (state: any) => ({
      metrics: state.metrics,
      goals: state.goals,
      insights: state.insights,
      offlineQueue: state.offlineQueue,
    }),
  } as PersistConfig<any>,

  focus: {
    name: 'timecraft-focus',
    storage: indexedDBAdapter('focus'),
    partialize: (state: any) => ({
      sessions: state.sessions,
      templates: state.templates,
      currentSession: state.currentSession,
      stats: state.stats,
    }),
  } as PersistConfig<any>,

  badges: {
    name: 'timecraft-badges',
    storage: indexedDBAdapter('badges'),
    partialize: (state: any) => ({
      badges: state.badges,
      progress: state.progress,
      achievements: state.achievements,
    }),
  } as PersistConfig<any>,

  social: {
    name: 'timecraft-social',
    storage: indexedDBAdapter('social'),
    partialize: (state: any) => ({
      connections: state.connections,
      challenges: state.challenges,
      activities: state.activities,
      offlineQueue: state.offlineQueue,
    }),
  } as PersistConfig<any>,

  voice: {
    name: 'timecraft-voice',
    storage: indexedDBAdapter('voice'),
    partialize: (state: any) => ({
      notes: state.notes,
      commands: state.commands,
      settings: state.settings,
      offlineQueue: state.offlineQueue,
    }),
  } as PersistConfig<any>,

  calendar: {
    name: 'timecraft-calendar',
    storage: indexedDBAdapter('calendar'),
    partialize: (state: any) => ({
      events: state.events,
      availability: state.availability,
      meetings: state.meetings,
      offlineQueue: state.offlineQueue,
    }),
  } as PersistConfig<any>,

  notifications: {
    name: 'timecraft-notifications',
    storage: indexedDBAdapter('notifications'),
    partialize: (state: any) => ({
      notifications: state.notifications,
      preferences: state.preferences,
      history: state.history,
    }),
  } as PersistConfig<any>,
};

// Utility function to create a persisted store
export const createPersistedStore = <T>(
  storeCreator: StateCreator<T>,
  persistConfig: PersistConfig<T>
) => {
  return persist(storeCreator, persistConfig);
};

// Offline queue management
export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class OfflineQueue {
  private queue: OfflineAction[] = [];
  private isProcessing = false;
  private maxRetries = 3;

  addAction(type: string, payload: any): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const action: OfflineAction = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries,
    };
    
    this.queue.push(action);
    this.saveQueue();
    
    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
    
    return id;
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    const actionsToProcess = [...this.queue];
    
    for (const action of actionsToProcess) {
      try {
        await this.processAction(action);
        this.removeAction(action.id);
      } catch (error) {
        action.retryCount++;
        
        if (action.retryCount >= action.maxRetries) {
          console.error('Action failed after max retries:', action, error);
          this.removeAction(action.id);
        } else {
          console.warn('Action failed, will retry:', action, error);
        }
      }
    }
    
    this.saveQueue();
    this.isProcessing = false;
  }

  private async processAction(action: OfflineAction): Promise<void> {
    // This would be implemented by each store to handle their specific actions
    // For now, we'll emit a custom event that stores can listen to
    const event = new CustomEvent('offline-action', { detail: action });
    window.dispatchEvent(event);
  }

  private removeAction(id: string): void {
    this.queue = this.queue.filter(action => action.id !== id);
  }

  private saveQueue(): void {
    try {
      localStorage.setItem('timecraft-offline-queue', JSON.stringify(this.queue));
    } catch {
      console.warn('Failed to save offline queue');
    }
  }

  loadQueue(): void {
    try {
      const saved = localStorage.getItem('timecraft-offline-queue');
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch {
      console.warn('Failed to load offline queue');
      this.queue = [];
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }
}

// Global offline queue instance
export const offlineQueue = new OfflineQueue();

// Initialize offline queue on app start
offlineQueue.loadQueue();

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('App is online, processing offline queue');
  offlineQueue.processQueue();
});

window.addEventListener('offline', () => {
  console.log('App is offline, actions will be queued');
});

// Utility to check if we should use offline mode
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

// Utility to wait for online status
export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
    } else {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };
      window.addEventListener('online', handleOnline);
    }
  });
};