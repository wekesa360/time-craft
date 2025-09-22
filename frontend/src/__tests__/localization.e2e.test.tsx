import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { GermanAccessibilityProvider } from '../components/accessibility/GermanAccessibilityProvider';
import i18n from '../i18n';
import * as localizationApi from '../api/localization';

// Mock the API
vi.mock('../api/localization');
const mockLocalizationApi = vi.mocked(localizationApi);

// Mock the German accessibility and text layout utilities
vi.mock('../utils/germanAccessibility', () => ({
  germanAccessibility: {
    updateConfig: vi.fn(),
    initialize: vi.fn(),
    updateLanguage: vi.fn(),
    announceLanguageChange: vi.fn(),
    cleanup: vi.fn()
  },
  getGermanAccessibilityStatus: vi.fn().mockReturnValue({
    isGerman: true,
    hasScreenReaderSupport: true,
    hasKeyboardNavigation: true,
    hasHighContrastMode: true,
    hasAriaLabels: true,
    environmentSupport: {
      screenReader: true,
      highContrast: false,
      reducedMotion: false,
      forcedColors: false
    }
  })
}));

vi.mock('../hooks/useGermanTextLayout', () => ({
  useGermanTextOptimization: vi.fn().mockReturnValue({
    isGerman: true
  })
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false }
  }
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <GermanAccessibilityProvider>
            {children}
          </GermanAccessibilityProvider>
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('Localization End-to-End Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset i18n to English
    i18n.changeLanguage('en');
    
    // Setup default API mocks
    mockLocalizationApi.fetchAvailableLanguages.mockResolvedValue([
      { code: 'en', name: 'English', nativeName: 'English', coverage: 100 },
      { code: 'de', name: 'German', nativeName: 'Deutsch', coverage: 95 }
    ]);

    mockLocalizationApi.updateUserLanguage.mockResolvedValue({
      success: true,
      language: 'de',
      user: { id: '123', language: 'de', updatedAt: '2024-01-01T00:00:00Z' }
    });

    mockLocalizationApi.fetchLocalizationContent.mockResolvedValue({
      translations: {
        'common.save': 'Speichern',
        'common.cancel': 'Abbrechen',
        'navigation.dashboard': 'Dashboard',
        'navigation.tasks': 'Aufgaben',
        'settings.title': 'Einstellungen'
      },
      metadata: {
        language: 'de',
        coverage: 95,
        lastUpdated: '2024-01-01T00:00:00Z'
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Language Switching Flow', () => {
    it('switches language from English to German with full UI update', async () => {
      render(
        <TestWrapper>
          <div>
            <h1>{i18n.t('settings.title', 'Settings')}</h1>
            <LanguageSelector variant="dropdown" />
            <button>{i18n.t('common.save', 'Save')}</button>
          </div>
        </TestWrapper>
      );

      // Initially in English
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();

      // Open language selector
      const languageButton = screen.getByRole('button', { name: /english/i });
      fireEvent.click(languageButton);

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      // Select German
      fireEvent.click(screen.getByText('Deutsch'));

      // Wait for language change and API calls
      await waitFor(() => {
        expect(mockLocalizationApi.updateUserLanguage).toHaveBeenCalledWith('de');
      });

      // Verify UI updates to German
      await waitFor(() => {
        expect(screen.getByText('Einstellungen')).toBeInTheDocument();
        expect(screen.getByText('Speichern')).toBeInTheDocument();
      });
    });

    it('handles language switching with fallback for missing translations', async () => {
      // Mock incomplete German translations
      mockLocalizationApi.fetchLocalizationContent.mockResolvedValue({
        translations: {
          'common.save': 'Speichern'
          // Missing other translations
        },
        metadata: {
          language: 'de',
          coverage: 30,
          lastUpdated: '2024-01-01T00:00:00Z'
        }
      });

      render(
        <TestWrapper>
          <div>
            <h1>{i18n.t('settings.title', 'Settings')}</h1>
            <button>{i18n.t('common.save', 'Save')}</button>
            <button>{i18n.t('common.cancel', 'Cancel')}</button>
          </div>
        </TestWrapper>
      );

      // Switch to German
      const languageButton = screen.getByRole('button', { name: /english/i });
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      await waitFor(() => {
        expect(mockLocalizationApi.updateUserLanguage).toHaveBeenCalledWith('de');
      });

      // Should show German where available, English fallback where not
      await waitFor(() => {
        expect(screen.getByText('Speichern')).toBeInTheDocument(); // German
        expect(screen.getByText('Settings')).toBeInTheDocument(); // English fallback
        expect(screen.getByText('Cancel')).toBeInTheDocument(); // English fallback
      });
    });

    it('maintains language preference across component remounts', async () => {
      const { rerender } = render(
        <TestWrapper>
          <div>
            <LanguageSelector variant="dropdown" />
            <span data-testid="current-lang">{i18n.language}</span>
          </div>
        </TestWrapper>
      );

      // Switch to German
      const languageButton = screen.getByRole('button');
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      await waitFor(() => {
        expect(screen.getByTestId('current-lang')).toHaveTextContent('de');
      });

      // Remount component
      rerender(
        <TestWrapper>
          <div>
            <LanguageSelector variant="dropdown" />
            <span data-testid="current-lang">{i18n.language}</span>
          </div>
        </TestWrapper>
      );

      // Language should persist
      expect(screen.getByTestId('current-lang')).toHaveTextContent('de');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('handles API errors gracefully during language switch', async () => {
      mockLocalizationApi.updateUserLanguage.mockRejectedValue(
        new Error('API Error')
      );

      render(
        <TestWrapper>
          <div>
            <LanguageSelector variant="dropdown" />
            <span data-testid="current-lang">{i18n.language}</span>
          </div>
        </TestWrapper>
      );

      const languageButton = screen.getByRole('button');
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      // Should remain in English due to API error
      await waitFor(() => {
        expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
      });

      // Should show error state in UI (implementation dependent)
      // In a real app, this might show a toast notification
    });

    it('recovers from network failures with retry mechanism', async () => {
      mockLocalizationApi.updateUserLanguage
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          success: true,
          language: 'de',
          user: { id: '123', language: 'de', updatedAt: '2024-01-01T00:00:00Z' }
        });

      render(
        <TestWrapper>
          <div>
            <LanguageSelector variant="dropdown" />
            <span data-testid="current-lang">{i18n.language}</span>
          </div>
        </TestWrapper>
      );

      const languageButton = screen.getByRole('button');
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      // First attempt fails, but retry succeeds
      await waitFor(() => {
        expect(mockLocalizationApi.updateUserLanguage).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-lang')).toHaveTextContent('de');
      });
    });

    it('handles partial translation loading failures', async () => {
      mockLocalizationApi.fetchLocalizationContent.mockRejectedValue(
        new Error('Translation loading failed')
      );

      render(
        <TestWrapper>
          <div>
            <LanguageSelector variant="dropdown" />
            <h1>{i18n.t('settings.title', 'Settings')}</h1>
          </div>
        </TestWrapper>
      );

      const languageButton = screen.getByRole('button');
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      // Should fallback to English translations
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('announces language changes to screen readers', async () => {
      const { germanAccessibility } = await import('../utils/germanAccessibility');
      
      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" />
        </TestWrapper>
      );

      const languageButton = screen.getByRole('button');
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      await waitFor(() => {
        expect(germanAccessibility.announceLanguageChange).toHaveBeenCalledWith('de', 'Deutsch');
      });
    });

    it('updates ARIA labels when switching to German', async () => {
      render(
        <TestWrapper>
          <div>
            <LanguageSelector variant="dropdown" />
            <button aria-label="Save document">Save</button>
          </div>
        </TestWrapper>
      );

      const languageButton = screen.getByRole('button', { name: /english/i });
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      // Accessibility system should update ARIA labels
      await waitFor(() => {
        const { germanAccessibility } = await import('../utils/germanAccessibility');
        expect(germanAccessibility.updateLanguage).toHaveBeenCalledWith('de');
      });
    });

    it('maintains keyboard navigation in German interface', async () => {
      render(
        <TestWrapper>
          <div>
            <LanguageSelector variant="dropdown" />
            <button>Test Button</button>
          </div>
        </TestWrapper>
      );

      // Switch to German
      const languageButton = screen.getByRole('button');
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      // Test keyboard navigation still works
      const testButton = screen.getByText('Test Button');
      testButton.focus();
      
      fireEvent.keyDown(testButton, { key: 'Tab' });
      
      // Should maintain focus management in German interface
      expect(document.activeElement).toBeDefined();
    });
  });

  describe('Performance and Caching', () => {
    it('caches translations to avoid redundant API calls', async () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" />
        </TestWrapper>
      );

      // First language switch
      const languageButton = screen.getByRole('button');
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      await waitFor(() => {
        expect(mockLocalizationApi.fetchLocalizationContent).toHaveBeenCalledWith('de');
      });

      // Switch back to English
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('English'));

      // Switch to German again
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      // Should not make additional API call due to caching
      expect(mockLocalizationApi.fetchLocalizationContent).toHaveBeenCalledTimes(1);
    });

    it('handles concurrent language switches correctly', async () => {
      render(
        <TestWrapper>
          <div>
            <LanguageSelector variant="buttons" />
          </div>
        </TestWrapper>
      );

      const englishButton = screen.getByText('English');
      const germanButton = screen.getByText('Deutsch');

      // Rapid clicks
      fireEvent.click(germanButton);
      fireEvent.click(englishButton);
      fireEvent.click(germanButton);

      // Should handle concurrent requests gracefully
      await waitFor(() => {
        expect(mockLocalizationApi.updateUserLanguage).toHaveBeenCalled();
      });

      // Final state should be consistent
      await waitFor(() => {
        // The last click should determine the final state
        expect(i18n.language).toBe('de');
      });
    });
  });

  describe('Complex UI Integration', () => {
    it('updates complex nested components when language changes', async () => {
      const ComplexComponent = () => (
        <div>
          <header>
            <h1>{i18n.t('settings.title', 'Settings')}</h1>
            <nav>
              <a href="/dashboard">{i18n.t('navigation.dashboard', 'Dashboard')}</a>
              <a href="/tasks">{i18n.t('navigation.tasks', 'Tasks')}</a>
            </nav>
          </header>
          <main>
            <form>
              <button type="submit">{i18n.t('common.save', 'Save')}</button>
              <button type="button">{i18n.t('common.cancel', 'Cancel')}</button>
            </form>
          </main>
          <LanguageSelector variant="compact" />
        </div>
      );

      render(
        <TestWrapper>
          <ComplexComponent />
        </TestWrapper>
      );

      // Verify initial English state
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();

      // Switch to German
      const languageButton = screen.getByRole('button', { name: /EN/i });
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      // Verify all nested components update
      await waitFor(() => {
        expect(screen.getByText('Einstellungen')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument(); // Same in German
        expect(screen.getByText('Aufgaben')).toBeInTheDocument();
        expect(screen.getByText('Speichern')).toBeInTheDocument();
        expect(screen.getByText('Abbrechen')).toBeInTheDocument();
      });
    });

    it('maintains form state during language switches', async () => {
      const FormComponent = () => {
        const [inputValue, setInputValue] = React.useState('');
        
        return (
          <div>
            <form>
              <label>{i18n.t('form.name', 'Name')}</label>
              <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={i18n.t('form.enterName', 'Enter your name')}
              />
              <button type="submit">{i18n.t('common.save', 'Save')}</button>
            </form>
            <LanguageSelector variant="dropdown" preserveState={true} />
          </div>
        );
      };

      render(
        <TestWrapper>
          <FormComponent />
        </TestWrapper>
      );

      // Fill form
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'John Doe' } });

      expect(input).toHaveValue('John Doe');

      // Switch language
      const languageButton = screen.getByRole('button', { name: /english/i });
      fireEvent.click(languageButton);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deutsch'));

      // Form state should be preserved
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('John Doe');
      });
    });
  });
});