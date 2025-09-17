import React, { useState } from 'react';
import { useThemeStore, type ThemeMode, type ColorTheme } from '../../stores/theme';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';

interface ThemeSelectorProps {
  className?: string;
  showColorThemes?: boolean;
}

export function ThemeSelector({ className = '', showColorThemes = true }: ThemeSelectorProps) {
  const {
    config,
    effectiveTheme,
    setThemeMode,
    setColorTheme,
    getAllColorThemes,
    previewColorTheme,
    resetPreview,
  } = useThemeStore();
  
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ColorTheme | null>(null);

  const themeModes: Array<{ key: ThemeMode; label: string; icon: React.ReactNode }> = [
    { key: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { key: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { key: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
  ];

  const colorThemes = getAllColorThemes();

  const handleColorThemeSelect = (colorTheme: ColorTheme) => {
    setColorTheme(colorTheme);
    setPreviewTheme(null);
    setIsColorPickerOpen(false);
    resetPreview();
  };

  const handleColorThemePreview = (colorTheme: ColorTheme) => {
    setPreviewTheme(colorTheme);
    previewColorTheme(colorTheme);
  };

  const handleColorThemePreviewEnd = () => {
    setPreviewTheme(null);
    resetPreview();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Theme Mode Selector */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Theme Mode
        </label>
        <div className="flex space-x-2">
          {themeModes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setThemeMode(mode.key)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all
                ${
                  config.mode === mode.key
                    ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900 dark:border-primary-700 dark:text-primary-300'
                    : 'bg-surface border-default text-secondary hover:bg-surface-elevated'
                }
              `}
            >
              {mode.icon}
              <span className="text-sm">{mode.label}</span>
              {config.mode === mode.key && (
                <Check className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-1">
          Current: {effectiveTheme === 'dark' ? 'Dark' : 'Light'}
        </p>
      </div>

      {/* Color Theme Selector */}
      {showColorThemes && (
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Color Theme
          </label>
          <div className="relative">
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="flex items-center space-x-2 px-3 py-2 bg-surface border border-default rounded-lg hover:bg-surface-elevated transition-colors w-full"
            >
              <div
                className="w-4 h-4 rounded-full border border-default"
                style={{
                  backgroundColor: `var(--color-primary-500)`,
                }}
              />
              <span className="text-sm flex-1 text-left">
                {colorThemes.find(t => t.key === config.colorTheme)?.name}
              </span>
              <Palette className="w-4 h-4 text-muted" />
            </button>

            {isColorPickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-default rounded-lg shadow-lg z-50 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {colorThemes.map((theme) => (
                    <button
                      key={theme.key}
                      onClick={() => handleColorThemeSelect(theme.key)}
                      onMouseEnter={() => handleColorThemePreview(theme.key)}
                      onMouseLeave={handleColorThemePreviewEnd}
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-left
                        ${
                          config.colorTheme === theme.key
                            ? 'bg-primary-100 border border-primary-300 dark:bg-primary-900 dark:border-primary-700'
                            : 'hover:bg-surface border border-transparent'
                        }
                      `}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-default"
                        style={{ backgroundColor: theme.colors[500] }}
                      />
                      <span className="text-sm flex-1">{theme.name}</span>
                      {config.colorTheme === theme.key && (
                        <Check className="w-3 h-3 text-primary-600" />
                      )}
                    </button>
                  ))}
                </div>
                
                {previewTheme && (
                  <div className="mt-3 pt-3 border-t border-default">
                    <p className="text-xs text-muted">
                      Previewing: {colorThemes.find(t => t.key === previewTheme)?.name}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theme Preview */}
      <div className="p-4 bg-surface border border-default rounded-lg">
        <h4 className="text-sm font-medium text-primary mb-2">Preview</h4>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <button className="btn btn-primary text-xs px-2 py-1">Primary</button>
            <button className="btn btn-secondary text-xs px-2 py-1">Secondary</button>
            <button className="btn btn-outline text-xs px-2 py-1">Outline</button>
          </div>
          <div className="card p-3">
            <p className="text-primary text-sm">Primary text</p>
            <p className="text-secondary text-xs">Secondary text</p>
            <p className="text-muted text-xs">Muted text</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick theme toggle button for headers/navbars
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { effectiveTheme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg bg-surface hover:bg-surface-elevated border border-default
        transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500
        ${className}
      `}
      aria-label="Toggle theme"
    >
      {effectiveTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-secondary" />
      ) : (
        <Moon className="w-4 h-4 text-secondary" />
      )}
    </button>
  );
}

// Color theme picker for quick selection
export function ColorThemePicker({ className = '' }: { className?: string }) {
  const { config, setColorTheme, getAllColorThemes } = useThemeStore();
  const colorThemes = getAllColorThemes();

  return (
    <div className={`flex space-x-2 ${className}`}>
      {colorThemes.map((theme) => (
        <button
          key={theme.key}
          onClick={() => setColorTheme(theme.key)}
          className={`
            w-6 h-6 rounded-full border-2 transition-all hover:scale-110
            ${
              config.colorTheme === theme.key
                ? 'border-white shadow-lg ring-2 ring-primary-500'
                : 'border-gray-300 dark:border-gray-600'
            }
          `}
          style={{ backgroundColor: theme.colors[500] }}
          title={theme.name}
          aria-label={`Select ${theme.name} theme`}
        />
      ))}
    </div>
  );
}