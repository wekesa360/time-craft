import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Palette, Sun, Moon, Monitor, Paintbrush, Sparkles,
  Check, ChevronDown, ChevronRight
} from 'lucide-react';
import { useThemeStore } from '../../stores/theme';

interface EnhancedAppearanceSectionProps {
  className?: string;
}

export function EnhancedAppearanceSection({ className = '' }: EnhancedAppearanceSectionProps) {
  const { t } = useTranslation();
  const {
    config,
    effectiveTheme,
    setThemeModeWithBackend,
    setColorThemeWithBackend,
    getAllColorThemes,
    previewColorTheme,
    resetPreview,
  } = useThemeStore();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    theme: true,
    colors: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const themeModes = [
    { key: 'light', label: t('settings.theme.light', 'Light'), icon: <Sun className="w-4 h-4" /> },
    { key: 'dark', label: t('settings.theme.dark', 'Dark'), icon: <Moon className="w-4 h-4" /> },
    { key: 'system', label: t('settings.theme.system', 'System'), icon: <Monitor className="w-4 h-4" /> },
  ];

  const colorThemes = getAllColorThemes();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleThemeModeSelect = async (mode: 'light' | 'dark' | 'system') => {
    setIsLoading(true);
    try {
      await setThemeModeWithBackend(mode);
    } catch (error) {
      console.error('Failed to update theme mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorThemeSelect = async (colorTheme: string) => {
    setIsLoading(true);
    try {
      await setColorThemeWithBackend(colorTheme as any);
      setPreviewTheme(null);
      resetPreview();
    } catch (error) {
      console.error('Failed to update color theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorThemePreview = (colorTheme: string) => {
    setPreviewTheme(colorTheme);
    previewColorTheme(colorTheme as any);
  };

  const handleColorThemePreviewEnd = () => {
    setPreviewTheme(null);
    resetPreview();
  };

  const SectionHeader = ({ 
    title, 
    icon, 
    sectionKey, 
    description 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    sectionKey: string; 
    description?: string;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-3 bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className="text-primary">{icon}</div>
        <div className="text-left">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Theme Mode Section */}
      <div>
        <SectionHeader
          title={t('settings.appearance.themeMode', 'Theme Mode')}
          icon={<Palette className="w-4 h-4" />}
          sectionKey="theme"
          description="Choose your preferred theme"
        />
        
        {expandedSections.theme && (
          <div className="mt-3 p-4 bg-card/50 rounded-lg border border-border/50">
            <div className="flex flex-wrap gap-2">
              {themeModes.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => handleThemeModeSelect(mode.key as any)}
                  disabled={isLoading}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${
                      config.mode === mode.key
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card border-border text-foreground hover:bg-primary/5 hover:border-primary/30'
                    }
                  `}
                >
                  {mode.icon}
                  <span className="text-sm font-medium">{mode.label}</span>
                  {config.mode === mode.key && (
                    <Check className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Current:</span> {effectiveTheme === 'dark' ? 'Dark' : 'Light'} theme
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Color Theme Section */}
      <div>
        <SectionHeader
          title={t('settings.appearance.colorTheme', 'Color Theme')}
          icon={<Paintbrush className="w-4 h-4" />}
          sectionKey="colors"
          description="Customize your app's color palette"
        />
        
        {expandedSections.colors && (
          <div className="mt-3 p-4 bg-card/50 rounded-lg border border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colorThemes.map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => handleColorThemeSelect(theme.key)}
                  onMouseEnter={() => handleColorThemePreview(theme.key)}
                  onMouseLeave={handleColorThemePreviewEnd}
                  disabled={isLoading}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border transition-all text-left
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${
                      config.colorTheme === theme.key
                        ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20'
                        : 'bg-card border-border hover:bg-primary/5 hover:border-primary/30'
                    }
                  `}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: theme.colors[500] }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block truncate">
                      {theme.name}
                    </span>
                  </div>
                  {config.colorTheme === theme.key && (
                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            
            {previewTheme && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Previewing: {colorThemes.find(t => t.key === previewTheme)?.name}
                </p>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  );
}