import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../stores/theme';
import { useAuthStore } from '../stores/auth';
import { apiClient } from '../lib/api';
import { ThemeSelector } from './ui/ThemeSelector';

export function PreferencesTest() {
  const { config, effectiveTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const prefs = await apiClient.getUserPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [isAuthenticated]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-muted rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-foreground dark:text-white mb-6">
          Preferences Test
        </h1>
        
        {/* Current Theme State */}
        <div className="mb-6 p-4 bg-muted dark:bg-muted rounded-lg">
          <h2 className="text-lg font-semibold text-foreground dark:text-white mb-3">
            Current Theme State
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground dark:text-muted-foreground">Mode:</span>
              <span className="ml-2 text-foreground dark:text-white">{config.mode}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground dark:text-muted-foreground">Color Theme:</span>
              <span className="ml-2 text-foreground dark:text-white">{config.colorTheme}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground dark:text-muted-foreground">Effective Theme:</span>
              <span className="ml-2 text-foreground dark:text-white">{effectiveTheme}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground dark:text-muted-foreground">Authenticated:</span>
              <span className="ml-2 text-foreground dark:text-white">{isAuthenticated ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Backend Preferences */}
        <div className="mb-6 p-4 bg-muted dark:bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground dark:text-white">
              Backend Preferences
            </h2>
            <button
              onClick={loadPreferences}
              disabled={loading}
              className="px-3 py-1 text-sm bg-info text-white rounded hover:bg-info disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {error && (
            <div className="mb-3 p-3 bg-error-light dark:bg-error/20 border border-red-300 dark:border-red-700 rounded text-error dark:text-error-light">
              Error: {error}
            </div>
          )}
          
          {preferences ? (
            <pre className="text-xs bg-white dark:bg-muted p-3 rounded border overflow-auto">
              {JSON.stringify(preferences, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground dark:text-muted-foreground">No preferences loaded</p>
          )}
        </div>

        {/* Theme Selector */}
        <div className="p-4 bg-muted dark:bg-muted rounded-lg">
          <h2 className="text-lg font-semibold text-foreground dark:text-white mb-4">
            Theme Selector
          </h2>
          <ThemeSelector />
        </div>

        {/* Test Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={loadPreferences}
            disabled={loading || !isAuthenticated}
            className="px-4 py-2 bg-success text-white rounded hover:bg-success disabled:opacity-50"
          >
            Load from Backend
          </button>
          
          <button
            onClick={async () => {
              try {
                await apiClient.updateUserPreferences({
                  theme: {
                    mode: config.mode,
                    colorTheme: config.colorTheme,
                  }
                });
                alert('Preferences saved to backend!');
                loadPreferences();
              } catch (err) {
                alert('Failed to save preferences: ' + (err instanceof Error ? err.message : 'Unknown error'));
              }
            }}
            disabled={!isAuthenticated}
            className="px-4 py-2 bg-info text-white rounded hover:bg-info disabled:opacity-50"
          >
            Save to Backend
          </button>
        </div>
      </div>
    </div>
  );
}


