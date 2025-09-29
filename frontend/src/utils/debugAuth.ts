/**
 * Debug utilities for authentication and localStorage monitoring
 */

import { localStorageCoordinator } from '../lib/localStorageCoordinator';

export class AuthDebugger {
  private static instance: AuthDebugger;
  private isMonitoring = false;
  private originalSetItem: typeof localStorage.setItem;
  private originalGetItem: typeof localStorage.getItem;
  private originalRemoveItem: typeof localStorage.removeItem;

  private constructor() {
    this.originalSetItem = localStorage.setItem.bind(localStorage);
    this.originalGetItem = localStorage.getItem.bind(localStorage);
    this.originalRemoveItem = localStorage.removeItem.bind(localStorage);
  }

  static getInstance(): AuthDebugger {
    if (!AuthDebugger.instance) {
      AuthDebugger.instance = new AuthDebugger();
    }
    return AuthDebugger.instance;
  }

  /**
   * Start monitoring localStorage operations
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🔍 Auth Debugger: Started monitoring localStorage operations');

    // Override localStorage methods to log operations
    localStorage.setItem = (key: string, value: string) => {
      console.log(`📝 localStorage.setItem: ${key}`, value);
      this.originalSetItem(key, value);
    };

    localStorage.getItem = (key: string) => {
      const value = this.originalGetItem(key);
      console.log(`📖 localStorage.getItem: ${key}`, value);
      return value;
    };

    localStorage.removeItem = (key: string) => {
      console.log(`🗑️ localStorage.removeItem: ${key}`);
      this.originalRemoveItem(key);
    };
  }

  /**
   * Stop monitoring localStorage operations
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    console.log('🔍 Auth Debugger: Stopped monitoring localStorage operations');

    // Restore original methods
    localStorage.setItem = this.originalSetItem;
    localStorage.getItem = this.originalGetItem;
    localStorage.removeItem = this.originalRemoveItem;
  }

  /**
   * Log current localStorage state
   */
  logCurrentState(): void {
    console.log('🔍 Current localStorage state:');
    const keys = localStorageCoordinator.getAllKeys();
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      const isCorrupted = localStorageCoordinator.isValueCorrupted(value);
      console.log(`  ${key}:`, {
        value: value?.substring(0, 100) + (value && value.length > 100 ? '...' : ''),
        isCorrupted,
        length: value?.length || 0
      });
    });
  }

  /**
   * Check for auth data corruption
   */
  checkAuthData(): {
    hasAuthData: boolean;
    isCorrupted: boolean;
    structure: any;
  } {
    const authData = localStorage.getItem('timecraft-auth');
    const isCorrupted = localStorageCoordinator.isValueCorrupted(authData);
    
    let structure = null;
    if (authData && !isCorrupted) {
      try {
        structure = JSON.parse(authData);
      } catch (error) {
        console.error('Failed to parse auth data structure:', error);
      }
    }

    return {
      hasAuthData: !!authData,
      isCorrupted,
      structure
    };
  }

  /**
   * Monitor language changes
   */
  monitorLanguageChanges(): void {
    const originalChangeLanguage = window.i18n?.changeLanguage;
    if (originalChangeLanguage) {
      window.i18n.changeLanguage = async (lng: string) => {
        console.log('🌐 Language change detected:', lng);
        this.logCurrentState();
        return originalChangeLanguage.call(window.i18n, lng);
      };
    }
  }

  /**
   * Get comprehensive debug report
   */
  getDebugReport(): {
    timestamp: string;
    localStorageAvailable: boolean;
    authData: ReturnType<AuthDebugger['checkAuthData']>;
    allKeys: string[];
    coordinatorStatus: {
      isProcessing: boolean;
      queueLength: number;
    };
    zustandDebug: {
      rawAuthData: string | null;
      parsedAuthData: any;
      isZustandObject: boolean;
    };
  } {
    const rawAuthData = localStorage.getItem('timecraft-auth');
    let parsedAuthData = null;
    let isZustandObject = false;
    
    try {
      if (rawAuthData) {
        parsedAuthData = JSON.parse(rawAuthData);
        isZustandObject = parsedAuthData && typeof parsedAuthData === 'object' && 'state' in parsedAuthData && 'version' in parsedAuthData;
      }
    } catch (error) {
      console.error('Failed to parse auth data for debug:', error);
    }

    return {
      timestamp: new Date().toISOString(),
      localStorageAvailable: localStorageCoordinator.isLocalStorageAvailable(),
      authData: this.checkAuthData(),
      allKeys: localStorageCoordinator.getAllKeys(),
      coordinatorStatus: {
        isProcessing: (localStorageCoordinator as any).isProcessing || false,
        queueLength: (localStorageCoordinator as any).writeQueue?.length || 0
      },
      zustandDebug: {
        rawAuthData,
        parsedAuthData,
        isZustandObject
      }
    };
  }
}

// Export singleton instance
export const authDebugger = AuthDebugger.getInstance();

// Development-only auto-start monitoring
if (process.env.NODE_ENV === 'development') {
  authDebugger.startMonitoring();
  authDebugger.monitorLanguageChanges();
  
  // Add global debug functions
  (window as any).debugAuth = {
    logState: () => authDebugger.logCurrentState(),
    checkAuth: () => authDebugger.checkAuthData(),
    getReport: () => authDebugger.getDebugReport(),
    clearAuth: () => localStorageCoordinator.clearTimeCraftData(),
    startMonitoring: () => authDebugger.startMonitoring(),
    stopMonitoring: () => authDebugger.stopMonitoring()
  };
  
  console.log('🔍 Auth Debugger: Available as window.debugAuth in development');
}
