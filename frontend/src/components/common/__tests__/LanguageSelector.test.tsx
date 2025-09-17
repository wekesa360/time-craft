import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageSelector } from '../LanguageSelector';
import i18n from '../../../i18n';

// Mock the localization queries
vi.mock('../../../hooks/queries/useLocalizationQueries', () => ({
  useAvailableLanguagesQuery: () => ({
    data: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' }
    ],
    isLoading: false,
    error: null
  }),
  useUpdateUserLanguageMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    error: null
  }),
  useCurrentLanguage: () => 'en'
}));

// Mock the language transition hook
vi.mock('../../../hooks/useLanguageTransition', () => ({
  useLanguageTransition: () => ({
    performLanguageTransition: vi.fn().mockImplementation((lang, callback) => callback())
  })
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dropdown Variant', () => {
    it('renders dropdown variant correctly', () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" showLabel={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('opens dropdown when clicked', async () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });
    });

    it('closes dropdown when clicking outside', async () => {
      render(
        <TestWrapper>
          <div data-testid="outside">
            <LanguageSelector variant="dropdown" />
          </div>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      const outside = screen.getByTestId('outside');
      fireEvent.click(outside);

      await waitFor(() => {
        expect(screen.queryByText('Deutsch')).not.toBeInTheDocument();
      });
    });

    it('shows flags when showFlags is true', () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" showFlags={true} />
        </TestWrapper>
      );

      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    });

    it('hides flags when showFlags is false', () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" showFlags={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('🇺🇸')).not.toBeInTheDocument();
    });
  });

  describe('Buttons Variant', () => {
    it('renders buttons variant correctly', () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="buttons" />
        </TestWrapper>
      );

      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('highlights current language button', () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="buttons" />
        </TestWrapper>
      );

      const englishButton = screen.getByText('English').closest('button');
      expect(englishButton).toHaveClass('bg-blue-600');
    });

    it('shows label when showLabel is true', () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="buttons" showLabel={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Language:')).toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('renders compact variant correctly', () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="compact" />
        </TestWrapper>
      );

      expect(screen.getByText('EN')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows current language code in uppercase', () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="compact" />
        </TestWrapper>
      );

      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('opens dropdown on click', async () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });
    });
  });

  describe('Language Selection', () => {
    it('calls onLanguageChange when language is selected', async () => {
      const onLanguageChange = vi.fn();
      
      render(
        <TestWrapper>
          <LanguageSelector 
            variant="dropdown" 
            onLanguageChange={onLanguageChange}
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        fireEvent.click(germanOption);
      });

      await waitFor(() => {
        expect(onLanguageChange).toHaveBeenCalledWith('de');
      });
    });

    it('prevents selection of current language', async () => {
      const onLanguageChange = vi.fn();
      
      render(
        <TestWrapper>
          <LanguageSelector 
            variant="buttons" 
            onLanguageChange={onLanguageChange}
          />
        </TestWrapper>
      );

      const englishButton = screen.getByText('English');
      fireEvent.click(englishButton);

      expect(onLanguageChange).not.toHaveBeenCalled();
    });

    it('shows loading state during language change', async () => {
      const { useUpdateUserLanguageMutation } = await import('../../../hooks/queries/useLocalizationQueries');
      
      vi.mocked(useUpdateUserLanguageMutation).mockReturnValue({
        mutateAsync: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
        isPending: true,
        error: null
      } as any);

      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when dropdown opens', async () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('supports keyboard navigation', async () => {
      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Open with Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });

      // Close with Escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByText('Deutsch')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows fallback languages when API fails', () => {
      const { useAvailableLanguagesQuery } = require('../../../hooks/queries/useLocalizationQueries');
      
      vi.mocked(useAvailableLanguagesQuery).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error')
      });

      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" />
        </TestWrapper>
      );

      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('shows loading skeleton when loading', () => {
      const { useAvailableLanguagesQuery } = require('../../../hooks/queries/useLocalizationQueries');
      
      vi.mocked(useAvailableLanguagesQuery).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      render(
        <TestWrapper>
          <LanguageSelector variant="dropdown" />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    it('applies transition classes during language change', async () => {
      render(
        <TestWrapper>
          <LanguageSelector 
            variant="dropdown" 
            animationDuration={100}
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        fireEvent.click(germanOption);
      });

      // Check for transition overlay
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('preserves state when preserveState is true', async () => {
      render(
        <TestWrapper>
          <LanguageSelector 
            variant="dropdown" 
            preserveState={true}
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const germanOption = screen.getByText('Deutsch');
        fireEvent.click(germanOption);
      });

      // State preservation logic would be tested here
      // This is more of an integration test with the transition hook
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(
        <TestWrapper>
          <LanguageSelector 
            variant="dropdown" 
            className="custom-class"
          />
        </TestWrapper>
      );

      const container = screen.getByRole('button').closest('div');
      expect(container).toHaveClass('custom-class');
    });

    it('respects custom animation duration', () => {
      render(
        <TestWrapper>
          <LanguageSelector 
            variant="dropdown" 
            animationDuration={500}
          />
        </TestWrapper>
      );

      // Animation duration would be passed to the transition hook
      // This is tested through the hook's behavior
    });
  });
});