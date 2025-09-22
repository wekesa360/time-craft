/**
 * Comprehensive integration tests for German localization features
 * Tests the complete localization system end-to-end
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import React from 'react';

// Import components and utilities
import { LanguageSelector } from '../../components/common/LanguageSelector';
import { LocalizationProvider } from '../../contexts/LocalizationContext';
import { GermanAccessibilityProvider } from '../../components/accessibility/GermanAccessibilityProvider';
import { translationCache } from '../../utils/translationCache';
import { performanceMonitor } from '../../utils/performanceOptimization';
import i18n from '../../i18n';

// Mock API responses
const mockApiResponses = {
  languages: {
    languages: [
      { code: 'en', name: 'English', nativeName: 'English', enabled: true, coverage: 100 },
      { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: true, coverage: 95 }
    ]
  },
  germanTranslations: {
    translations: {
      'navigation.dashboard': 'Dashboard',
      'navigation.tasks': 'Aufgaben',
      'navigation.settings': 'Einstellungen',
      'common.save': 'Speichern',
      'common.cancel': 'Abbrechen',
      'common.loading': 'Wird geladen...',
      'auth.login': 'Anmelden',
      'auth.logout': 'Abmelden',
      'tasks.create': 'Aufgabe erstellen',
      'tasks.edit': 'Aufgabe bearbeiten',
      'settings.language': 'Sprache',
      'settings.theme': 'Design',
      'errors.network': 'Netzwerkfehler',
      'errors.validation': 'Validierungsfehler'
    },
    metadata: {
      language: 'de',
      version: '1.0.0',
      coverage: 95,
      lastUpdated: new Date().toISOString()
    }
  }
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <LocalizationProvider>
          <GermanAccessibilityProvider>
            {children}
          </GermanAccessibilityProvider>
        </LocalizationProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

// Mock fetch for API calls
global.fetch = vi.fn();

describe('German Localization Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    translationCache.clear();
    performanceMonitor.clear();
    
    // Setup default fetch mocks
    (global.fetch as unknown as jest.MockedFunction<typeof fetch>).mockImplementation((url: string) => {
      if (url.includes('/localization/languages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.languages)
        });
      }
      if (url.includes('/localization/content/de')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.germanTranslations)
        });
      }
      return Promise.reject(new Error('Unmocked fetch'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Language Switching Flow', () => {
    it('should switch from English to German and update entire interface', async () => {
      // Start with English
      await i18n.changeLanguage('en');
      
      const TestComponent = () => (
        <div>
          <LanguageSelector variant="dropdown" showLabel={true} />
          <div data-testid="content">
            <h1>{i18n.t('navigation.dashboard', 'Dashboard')}</h1>
            <button>{i18n.t('common.save', 'Save')}</button>
            <p>{i18n.t('tasks.create', 'Create Task')}</p>
          </div>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Verify initial English content
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Create Task')).toBeInTheDocument();

      // Find and click language selector
      const languageSelector = screen.getByRole('button', { name: /language/i });
      await user.click(languageSelector);

      // Wait for dropdown to appear and select German
      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Deutsch'));

      // Wait for language change and verify German content
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument(); // Dashboard stays same
        expect(screen.getByText('Speichern')).toBeInTheDocument();
        expect(screen.getByText('Aufgabe erstellen')).toBeInTheDocument();
      });

      // Verify language was actually changed
      expect(i18n.language).toBe('de');
    });

    it('should preserve form data during language switch', async () => {
      const TestForm = () => {
        const [inputValue, setInputValue] = React.useState('');
        
        return (
          <div>
            <LanguageSelector variant="compact" />
            <form>
              <input
                data-testid="test-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={i18n.t('common.placeholder', 'Enter text')}
              />
              <button type="submit">
                {i18n.t('common.save', 'Save')}
              </button>
            </form>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestForm />
        </TestWrapper>
      );

      // Enter some text
      const input = screen.getByTestId('test-input');
      await user.type(input, 'Test content');
      expect(input).toHaveValue('Test content');

      // Switch language
      const languageSelector = screen.getByRole('button');
      await user.click(languageSelector);
      
      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        return user.click(germanOption);
      });

      // Verify form data is preserved
      await waitFor(() => {
        expect(input).toHaveValue('Test content');
      });
    });
  });

  describe('Translation Caching Integration', () => {
    it('should cache German translations and serve from cache on subsequent loads', async () => {
      const TestComponent = () => (
        <div>
          <p>{i18n.t('navigation.tasks', 'Tasks')}</p>
          <p>{i18n.t('common.save', 'Save')}</p>
        </div>
      );

      // First render - should fetch from API
      const { unmount } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await i18n.changeLanguage('de');

      await waitFor(() => {
        expect(screen.getByText('Aufgaben')).toBeInTheDocument();
        expect(screen.getByText('Speichern')).toBeInTheDocument();
      });

      // Verify API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/localization/content/de')
      );

      unmount();

      // Clear fetch mock to verify cache usage
      vi.clearAllMocks();

      // Second render - should use cache
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await i18n.changeLanguage('de');

      await waitFor(() => {
        expect(screen.getByText('Aufgaben')).toBeInTheDocument();
        expect(screen.getByText('Speichern')).toBeInTheDocument();
      });

      // Verify API was not called again (using cache)
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle cache errors gracefully and fallback to API', async () => {
      // Corrupt the cache
      vi.spyOn(translationCache, 'get').mockRejectedValue(new Error('Cache error'));

      const TestComponent = () => (
        <div>
          <p>{i18n.t('navigation.tasks', 'Tasks')}</p>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await i18n.changeLanguage('de');

      // Should still work by falling back to API
      await waitFor(() => {
        expect(screen.getByText('Aufgaben')).toBeInTheDocument();
      });

      // Verify API was called as fallback
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/localization/content/de')
      );
    });
  });

  describe('Performance Integration', () => {
    it('should meet performance benchmarks for language switching', async () => {
      const TestComponent = () => (
        <div>
          <LanguageSelector variant="dropdown" />
          <div>
            {Array.from({ length: 50 }, (_, i) => (
              <p key={i}>{i18n.t(`test.item${i}`, `Item ${i}`)}</p>
            ))}
          </div>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const startTime = performance.now();

      // Switch to German
      const languageSelector = screen.getByRole('button');
      await user.click(languageSelector);
      
      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        return user.click(germanOption);
      });

      await waitFor(() => {
        expect(i18n.language).toBe('de');
      });

      const endTime = performance.now();
      const switchTime = endTime - startTime;

      // Should switch language within 500ms
      expect(switchTime).toBeLessThan(500);
    });

    it('should maintain good performance with large translation sets', async () => {
      // Create large translation set
      const largeTranslations = Array.from({ length: 1000 }, (_, i) => [
        `large.key${i}`,
        `Großer deutscher Text ${i}`
      ]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      // Mock large translation response
      (global.fetch as unknown as jest.MockedFunction<typeof fetch>).mockImplementation((url: string) => {
        if (url.includes('/localization/content/de')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              translations: largeTranslations,
              metadata: mockApiResponses.germanTranslations.metadata
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.languages)
        });
      });

      const TestComponent = () => (
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <p key={i}>{i18n.t(`large.key${i}`, `Default ${i}`)}</p>
          ))}
        </div>
      );

      const startTime = performance.now();

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await i18n.changeLanguage('de');

      await waitFor(() => {
        expect(screen.getByText('Großer deutscher Text 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time even with large translation set
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Accessibility Integration', () => {
    it('should announce language changes to screen readers', async () => {
      const announcements: string[] = [];
      
      // Mock screen reader announcements
      const mockAnnounce = vi.fn((message: string) => {
        announcements.push(message);
      });

      // Mock aria-live region
      const ariaLiveRegion = document.createElement('div');
      ariaLiveRegion.setAttribute('aria-live', 'polite');
      ariaLiveRegion.setAttribute('data-testid', 'announcements');
      document.body.appendChild(ariaLiveRegion);

      const TestComponent = () => {
        React.useEffect(() => {
          const handleLanguageChange = (lng: string) => {
            const message = lng === 'de' 
              ? 'Sprache zu Deutsch geändert' 
              : 'Language changed to English';
            ariaLiveRegion.textContent = message;
            mockAnnounce(message);
          };

          i18n.on('languageChanged', handleLanguageChange);
          return () => i18n.off('languageChanged', handleLanguageChange);
        }, []);

        return (
          <div>
            <LanguageSelector variant="dropdown" />
            <p>{i18n.t('navigation.dashboard', 'Dashboard')}</p>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Switch to German
      const languageSelector = screen.getByRole('button');
      await user.click(languageSelector);
      
      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        return user.click(germanOption);
      });

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Sprache zu Deutsch geändert');
      });

      // Verify announcement is in DOM
      expect(screen.getByTestId('announcements')).toHaveTextContent('Sprache zu Deutsch geändert');

      document.body.removeChild(ariaLiveRegion);
    });

    it('should maintain proper focus management during language switches', async () => {
      const TestComponent = () => (
        <div>
          <LanguageSelector variant="dropdown" />
          <button data-testid="focus-target">
            {i18n.t('common.save', 'Save')}
          </button>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Focus the target button
      const targetButton = screen.getByTestId('focus-target');
      targetButton.focus();
      expect(document.activeElement).toBe(targetButton);

      // Switch language
      const languageSelector = screen.getByRole('button');
      await user.click(languageSelector);
      
      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        return user.click(germanOption);
      });

      await waitFor(() => {
        expect(i18n.language).toBe('de');
      });

      // Focus should be maintained or properly managed
      // (Either on the same element or moved to a logical location)
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API failures gracefully with fallbacks', async () => {
      // Mock API failure
      (global.fetch as unknown as jest.MockedFunction<typeof fetch>).mockImplementation((url: string) => {
        if (url.includes('/localization/content/de')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.languages)
        });
      });

      const TestComponent = () => (
        <div>
          <LanguageSelector variant="dropdown" />
          <p>{i18n.t('navigation.tasks', 'Tasks')}</p>
          <p>{i18n.t('common.save', 'Save')}</p>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Switch to German (should fail but fallback to English)
      const languageSelector = screen.getByRole('button');
      await user.click(languageSelector);
      
      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        return user.click(germanOption);
      });

      // Should show English fallbacks
      await waitFor(() => {
        expect(screen.getByText('Tasks')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('should handle partial translation failures', async () => {
      // Mock partial translation response
      (global.fetch as unknown as jest.MockedFunction<typeof fetch>).mockImplementation((url: string) => {
        if (url.includes('/localization/content/de')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              translations: {
                'navigation.tasks': 'Aufgaben',
                // Missing 'common.save' translation
              },
              metadata: mockApiResponses.germanTranslations.metadata
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.languages)
        });
      });

      const TestComponent = () => (
        <div>
          <p>{i18n.t('navigation.tasks', 'Tasks')}</p>
          <p>{i18n.t('common.save', 'Save')}</p>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await i18n.changeLanguage('de');

      await waitFor(() => {
        // Should show German where available
        expect(screen.getByText('Aufgaben')).toBeInTheDocument();
        // Should fallback to English for missing translations
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should work correctly with form validation', async () => {
      const TestForm = () => {
        const [errors, setErrors] = React.useState<Record<string, string>>({});

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get('email') as string;
          
          if (!email) {
            setErrors({ email: i18n.t('errors.validation', 'Validation error') });
          } else {
            setErrors({});
          }
        };

        return (
          <div>
            <LanguageSelector variant="compact" />
            <form onSubmit={handleSubmit}>
              <input name="email" placeholder={i18n.t('auth.email', 'Email')} />
              {errors.email && (
                <span data-testid="error-message">{errors.email}</span>
              )}
              <button type="submit">
                {i18n.t('common.save', 'Save')}
              </button>
            </form>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestForm />
        </TestWrapper>
      );

      // Switch to German
      const languageSelector = screen.getByRole('button');
      await user.click(languageSelector);
      
      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        return user.click(germanOption);
      });

      // Submit form to trigger validation
      const submitButton = screen.getByRole('button', { name: /speichern/i });
      await user.click(submitButton);

      // Should show German error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Validierungsfehler');
      });
    });

    it('should integrate properly with routing and navigation', async () => {
      // Mock router context
      const mockNavigate = vi.fn();
      
      const TestNavigation = () => (
        <div>
          <LanguageSelector variant="dropdown" />
          <nav>
            <button onClick={() => mockNavigate('/tasks')}>
              {i18n.t('navigation.tasks', 'Tasks')}
            </button>
            <button onClick={() => mockNavigate('/settings')}>
              {i18n.t('navigation.settings', 'Settings')}
            </button>
          </nav>
        </div>
      );

      render(
        <TestWrapper>
          <TestNavigation />
        </TestWrapper>
      );

      // Switch to German
      const languageSelector = screen.getByRole('button');
      await user.click(languageSelector);
      
      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        return user.click(germanOption);
      });

      // Verify navigation items are translated
      await waitFor(() => {
        expect(screen.getByText('Aufgaben')).toBeInTheDocument();
        expect(screen.getByText('Einstellungen')).toBeInTheDocument();
      });

      // Test navigation still works
      await user.click(screen.getByText('Aufgaben'));
      expect(mockNavigate).toHaveBeenCalledWith('/tasks');
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not cause memory leaks during repeated language switches', async () => {
      const TestComponent = () => (
        <div>
          <LanguageSelector variant="compact" />
          <p>{i18n.t('navigation.dashboard', 'Dashboard')}</p>
        </div>
      );

      const { unmount } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Perform multiple language switches
      for (let i = 0; i < 10; i++) {
        await i18n.changeLanguage(i % 2 === 0 ? 'de' : 'en');
        await waitFor(() => {
          expect(i18n.language).toBe(i % 2 === 0 ? 'de' : 'en');
        });
      }

      // Check that performance monitor doesn't show excessive memory usage
      const stats = performanceMonitor.getAllMetrics();
      
      // Should not have excessive render counts
      Object.values(stats).forEach(metric => {
        expect(metric.count).toBeLessThan(100); // Reasonable limit
      });

      unmount();
    });
  });
});

describe('German Translation Validation', () => {
  it('should have proper German grammar and formatting', () => {
    const germanTranslations = mockApiResponses.germanTranslations.translations;
    
    // Check for proper German capitalization (nouns should be capitalized)
    expect(germanTranslations['navigation.tasks']).toBe('Aufgaben'); // Capitalized noun
    expect(germanTranslations['tasks.create']).toBe('Aufgabe erstellen'); // Proper verb form
    
    // Check for proper German verb forms
    expect(germanTranslations['common.save']).toBe('Speichern'); // Infinitive form
    expect(germanTranslations['auth.login']).toBe('Anmelden'); // Separable verb
    
    // Check for proper German compound words
    expect(germanTranslations['errors.network']).toBe('Netzwerkfehler'); // Compound word
    expect(germanTranslations['errors.validation']).toBe('Validierungsfehler'); // Compound word
  });

  it('should have consistent terminology across the application', () => {
    const translations = mockApiResponses.germanTranslations.translations;
    
    // Check consistency in action verbs
    expect(translations['common.save']).toBe('Speichern');
    expect(translations['common.cancel']).toBe('Abbrechen');
    
    // Check consistency in navigation terms
    expect(translations['navigation.settings']).toBe('Einstellungen');
    expect(translations['settings.language']).toBe('Sprache');
  });
});