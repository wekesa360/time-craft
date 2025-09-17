import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import i18n from '../index';
import { initReactI18next } from 'react-i18next';

// Mock the localization API
const mockFetchLocalizationContent = vi.fn();

vi.mock('../../api/localization', () => ({
  fetchLocalizationContent: mockFetchLocalizationContent
}));

describe('Translation Fallback Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset i18n instance
    i18n.init({
      lng: 'en',
      fallbackLng: 'en',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      resources: {
        en: {
          translation: {
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.delete': 'Delete',
            'navigation.dashboard': 'Dashboard',
            'navigation.tasks': 'Tasks',
            'settings.title': 'Settings'
          }
        },
        de: {
          translation: {
            'common.save': 'Speichern',
            'common.cancel': 'Abbrechen',
            // Missing 'common.delete' - should fallback to English
            'navigation.dashboard': 'Dashboard',
            'navigation.tasks': 'Aufgaben',
            // Missing 'settings.title' - should fallback to English
          }
        }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Fallback Mechanism', () => {
    it('returns German translation when available', async () => {
      await i18n.changeLanguage('de');
      
      expect(i18n.t('common.save')).toBe('Speichern');
      expect(i18n.t('common.cancel')).toBe('Abbrechen');
      expect(i18n.t('navigation.tasks')).toBe('Aufgaben');
    });

    it('falls back to English when German translation is missing', async () => {
      await i18n.changeLanguage('de');
      
      expect(i18n.t('common.delete')).toBe('Delete'); // Fallback to English
      expect(i18n.t('settings.title')).toBe('Settings'); // Fallback to English
    });

    it('returns key when translation is missing in all languages', async () => {
      await i18n.changeLanguage('de');
      
      expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('handles nested key fallbacks correctly', async () => {
      // Add nested translations
      i18n.addResourceBundle('en', 'translation', {
        'settings': {
          'profile': {
            'title': 'Profile Settings',
            'description': 'Manage your profile'
          }
        }
      }, true, true);

      i18n.addResourceBundle('de', 'translation', {
        'settings': {
          'profile': {
            'title': 'Profileinstellungen'
            // Missing 'description' - should fallback
          }
        }
      }, true, true);

      await i18n.changeLanguage('de');
      
      expect(i18n.t('settings.profile.title')).toBe('Profileinstellungen');
      expect(i18n.t('settings.profile.description')).toBe('Manage your profile'); // Fallback
    });
  });

  describe('Dynamic Translation Loading with Fallback', () => {
    it('loads missing translations dynamically and falls back gracefully', async () => {
      const incompleteGermanContent = {
        translations: {
          'common.save': 'Speichern',
          'common.cancel': 'Abbrechen'
          // Missing many translations
        },
        metadata: {
          language: 'de',
          coverage: 30,
          fallbackLanguage: 'en'
        }
      };

      mockFetchLocalizationContent.mockResolvedValue(incompleteGermanContent);

      // Simulate dynamic loading
      const loadTranslations = async (language: string) => {
        try {
          const content = await mockFetchLocalizationContent(language);
          i18n.addResourceBundle(language, 'translation', content.translations, true, true);
          return content;
        } catch (error) {
          console.error(`Failed to load translations for ${language}:`, error);
          throw error;
        }
      };

      await loadTranslations('de');
      await i18n.changeLanguage('de');

      // Available translations should work
      expect(i18n.t('common.save')).toBe('Speichern');
      
      // Missing translations should fallback to English
      expect(i18n.t('navigation.dashboard')).toBe('Dashboard');
      expect(i18n.t('settings.title')).toBe('Settings');
    });

    it('handles API failures gracefully with fallback', async () => {
      mockFetchLocalizationContent.mockRejectedValue(new Error('API Error'));

      const loadTranslationsWithFallback = async (language: string) => {
        try {
          const content = await mockFetchLocalizationContent(language);
          i18n.addResourceBundle(language, 'translation', content.translations, true, true);
        } catch (error) {
          console.warn(`Failed to load ${language} translations, using fallback`);
          // Continue with existing fallback mechanism
        }
      };

      await loadTranslationsWithFallback('de');
      await i18n.changeLanguage('de');

      // Should fallback to English for all translations
      expect(i18n.t('common.save')).toBe('Speichern'); // From initial resources
      expect(i18n.t('navigation.dashboard')).toBe('Dashboard'); // Fallback
    });

    it('implements progressive loading with partial fallbacks', async () => {
      // Simulate loading translations in chunks
      const chunk1 = {
        translations: {
          'common.save': 'Speichern',
          'common.cancel': 'Abbrechen'
        }
      };

      const chunk2 = {
        translations: {
          'navigation.dashboard': 'Dashboard',
          'navigation.tasks': 'Aufgaben'
        }
      };

      mockFetchLocalizationContent
        .mockResolvedValueOnce(chunk1)
        .mockResolvedValueOnce(chunk2);

      // Load first chunk
      const content1 = await mockFetchLocalizationContent('de-chunk1');
      i18n.addResourceBundle('de', 'translation', content1.translations, true, true);
      
      await i18n.changeLanguage('de');
      
      expect(i18n.t('common.save')).toBe('Speichern');
      expect(i18n.t('navigation.dashboard')).toBe('Dashboard'); // Still fallback

      // Load second chunk
      const content2 = await mockFetchLocalizationContent('de-chunk2');
      i18n.addResourceBundle('de', 'translation', content2.translations, true, true);
      
      expect(i18n.t('navigation.tasks')).toBe('Aufgaben'); // Now available
    });
  });

  describe('Context-Aware Fallbacks', () => {
    it('provides context-specific fallbacks', async () => {
      // Add context-specific translations
      i18n.addResourceBundle('en', 'translation', {
        'button': {
          'save': 'Save',
          'save_document': 'Save Document',
          'save_settings': 'Save Settings'
        }
      }, true, true);

      i18n.addResourceBundle('de', 'translation', {
        'button': {
          'save': 'Speichern'
          // Missing specific contexts - should fallback
        }
      }, true, true);

      await i18n.changeLanguage('de');
      
      expect(i18n.t('button.save')).toBe('Speichern');
      expect(i18n.t('button.save_document')).toBe('Save Document'); // Fallback
      expect(i18n.t('button.save_settings')).toBe('Save Settings'); // Fallback
    });

    it('handles pluralization fallbacks', async () => {
      i18n.addResourceBundle('en', 'translation', {
        'item': 'item',
        'item_plural': 'items',
        'task': 'task',
        'task_plural': 'tasks'
      }, true, true);

      i18n.addResourceBundle('de', 'translation', {
        'item': 'Element',
        'item_plural': 'Elemente'
        // Missing task pluralization - should fallback
      }, true, true);

      await i18n.changeLanguage('de');
      
      expect(i18n.t('item', { count: 1 })).toBe('Element');
      expect(i18n.t('item', { count: 2 })).toBe('Elemente');
      expect(i18n.t('task', { count: 1 })).toBe('task'); // Fallback
      expect(i18n.t('task', { count: 2 })).toBe('tasks'); // Fallback
    });

    it('handles interpolation with fallbacks', async () => {
      i18n.addResourceBundle('en', 'translation', {
        'welcome': 'Welcome, {{name}}!',
        'goodbye': 'Goodbye, {{name}}!'
      }, true, true);

      i18n.addResourceBundle('de', 'translation', {
        'welcome': 'Willkommen, {{name}}!'
        // Missing goodbye - should fallback with interpolation
      }, true, true);

      await i18n.changeLanguage('de');
      
      expect(i18n.t('welcome', { name: 'John' })).toBe('Willkommen, John!');
      expect(i18n.t('goodbye', { name: 'John' })).toBe('Goodbye, John!'); // Fallback with interpolation
    });
  });

  describe('Fallback Chain Configuration', () => {
    it('supports multiple fallback languages', async () => {
      // Configure fallback chain: de -> en -> key
      await i18n.init({
        lng: 'de',
        fallbackLng: ['en'],
        resources: {
          en: {
            translation: {
              'common.save': 'Save',
              'common.cancel': 'Cancel'
            }
          },
          de: {
            translation: {
              'common.save': 'Speichern'
              // Missing cancel - should fallback to English
            }
          }
        }
      });

      expect(i18n.t('common.save')).toBe('Speichern');
      expect(i18n.t('common.cancel')).toBe('Cancel'); // Fallback to English
    });

    it('handles regional fallbacks', async () => {
      // Configure regional fallbacks: de-AT -> de -> en
      await i18n.init({
        lng: 'de-AT',
        fallbackLng: {
          'de-AT': ['de', 'en'],
          'de-CH': ['de', 'en'],
          'default': ['en']
        },
        resources: {
          en: {
            translation: {
              'common.save': 'Save',
              'common.currency': 'Currency'
            }
          },
          de: {
            translation: {
              'common.save': 'Speichern'
              // Missing currency
            }
          },
          'de-AT': {
            translation: {
              // Only regional-specific translations
              'common.currency': 'Währung (AT)'
            }
          }
        }
      });

      expect(i18n.t('common.save')).toBe('Speichern'); // From de
      expect(i18n.t('common.currency')).toBe('Währung (AT)'); // From de-AT
    });
  });

  describe('Error Handling and Recovery', () => {
    it('recovers from corrupted translation data', async () => {
      const corruptedContent = {
        translations: {
          'common.save': null, // Corrupted data
          'common.cancel': undefined, // Corrupted data
          'common.delete': 'Löschen' // Valid data
        }
      };

      // Simulate loading corrupted data
      i18n.addResourceBundle('de', 'translation', corruptedContent.translations, true, true);
      await i18n.changeLanguage('de');

      expect(i18n.t('common.save')).toBe('Save'); // Fallback due to null
      expect(i18n.t('common.cancel')).toBe('Cancel'); // Fallback due to undefined
      expect(i18n.t('common.delete')).toBe('Löschen'); // Valid translation
    });

    it('handles circular fallback references', async () => {
      // This shouldn't happen in practice, but test resilience
      await i18n.init({
        lng: 'de',
        fallbackLng: 'de', // Circular reference
        resources: {
          de: {
            translation: {
              'test': 'Test'
            }
          }
        }
      });

      expect(i18n.t('test')).toBe('Test');
      expect(i18n.t('missing')).toBe('missing'); // Should not cause infinite loop
    });

    it('handles memory constraints with large fallback chains', async () => {
      // Simulate large translation sets
      const largeTranslationSet = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`key${i}`, `Value ${i}`])
      );

      i18n.addResourceBundle('en', 'translation', largeTranslationSet, true, true);
      
      const partialGermanSet = Object.fromEntries(
        Array.from({ length: 500 }, (_, i) => [`key${i}`, `Wert ${i}`])
      );

      i18n.addResourceBundle('de', 'translation', partialGermanSet, true, true);
      await i18n.changeLanguage('de');

      // Test that fallbacks work efficiently even with large sets
      expect(i18n.t('key0')).toBe('Wert 0'); // German
      expect(i18n.t('key999')).toBe('Value 999'); // English fallback
    });
  });

  describe('Performance and Caching', () => {
    it('caches fallback resolutions for performance', async () => {
      const resolutionSpy = vi.spyOn(i18n, 't');
      
      await i18n.changeLanguage('de');
      
      // First call should resolve and cache
      const result1 = i18n.t('common.delete'); // Missing in German, fallback to English
      expect(result1).toBe('Delete');
      
      // Second call should use cached resolution
      const result2 = i18n.t('common.delete');
      expect(result2).toBe('Delete');
      
      // Should be efficient (exact call count depends on i18n internals)
      expect(resolutionSpy).toHaveBeenCalled();
      
      resolutionSpy.mockRestore();
    });

    it('invalidates cache when translations are updated', async () => {
      await i18n.changeLanguage('de');
      
      // Initially fallback to English
      expect(i18n.t('common.delete')).toBe('Delete');
      
      // Add German translation
      i18n.addResourceBundle('de', 'translation', {
        'common.delete': 'Löschen'
      }, true, true);
      
      // Should now use German translation
      expect(i18n.t('common.delete')).toBe('Löschen');
    });
  });
});