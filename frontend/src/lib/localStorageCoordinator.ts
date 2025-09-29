/**
 * localStorage Coordination System
 * Prevents race conditions between i18next and Zustand persist middleware
 */

class LocalStorageCoordinator {
  private writeQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private writeLock = false;

  /**
   * Safely write to localStorage with coordination
   */
  async safeWrite(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeQueue.push(async () => {
        try {
          // Wait for any ongoing writes to complete
          while (this.writeLock) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          this.writeLock = true;
          localStorage.setItem(key, value);
          this.writeLock = false;
          resolve();
        } catch (error) {
          this.writeLock = false;
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Safely read from localStorage
   */
  safeRead(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to read from localStorage key: ${key}`, error);
      return null;
    }
  }

  /**
   * Safely remove from localStorage
   */
  async safeRemove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeQueue.push(async () => {
        try {
          while (this.writeLock) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          this.writeLock = true;
          localStorage.removeItem(key);
          this.writeLock = false;
          resolve();
        } catch (error) {
          this.writeLock = false;
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the write queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.writeQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.writeQueue.length > 0) {
      const writeOperation = this.writeQueue.shift();
      if (writeOperation) {
        try {
          await writeOperation();
        } catch (error) {
          console.error('localStorage write operation failed:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Check if localStorage is available and not corrupted
   */
  isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      const testValue = 'test';
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved === testValue;
    } catch {
      return false;
    }
  }

  /**
   * Validate that a stored value is not corrupted
   */
  isValueCorrupted(value: string | null): boolean {
    if (!value) return false;
    
    // Check for common corruption patterns
    const corruptionPatterns = [
      '[object Object]',
      'undefined',
      'null',
      'NaN',
      '[object Undefined]',
      '[object Null]'
    ];
    
    return corruptionPatterns.some(pattern => 
      value === pattern || value.includes(pattern)
    );
  }

  /**
   * Get all localStorage keys for debugging
   */
  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  }

  /**
   * Clear all Time Craft related localStorage data
   */
  async clearTimeCraftData(): Promise<void> {
    const keys = this.getAllKeys();
    const timeCraftKeys = keys.filter(key => 
      key.startsWith('timecraft-') || 
      key.startsWith('i18next') ||
      key.includes('auth') ||
      key.includes('token')
    );
    
    for (const key of timeCraftKeys) {
      await this.safeRemove(key);
    }
  }
}

// Export singleton instance
export const localStorageCoordinator = new LocalStorageCoordinator();
export default localStorageCoordinator;
