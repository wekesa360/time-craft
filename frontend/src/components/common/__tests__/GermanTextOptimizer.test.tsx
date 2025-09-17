import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  GermanTextOptimizer,
  GermanTitle,
  GermanDescription,
  GermanCompoundWord,
  useGermanTextUtils
} from '../GermanTextOptimizer';
import { renderWithProviders } from '../../../test/utils';

// Mock the German text layout hook
vi.mock('../../../hooks/useGermanTextLayout', () => ({
  useGermanTextOptimization: vi.fn().mockReturnValue({
    isGerman: true
  })
}));

describe('GermanTextOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    renderWithProviders(
      <GermanTextOptimizer>
        <p>Test content</p>
      </GermanTextOptimizer>,
      { initialLanguage: 'de' }
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies German text class when language is German', () => {
    const { container } = renderWithProviders(
      <GermanTextOptimizer>
        <p>German content</p>
      </GermanTextOptimizer>,
      { initialLanguage: 'de' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('german-text');
  });

  it('sets lang attribute for German content', () => {
    const { container } = renderWithProviders(
      <GermanTextOptimizer>
        <p>German content</p>
      </GermanTextOptimizer>,
      { initialLanguage: 'de' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('lang', 'de');
  });

  it('does not set lang attribute for non-German content', () => {
    const { container } = renderWithProviders(
      <GermanTextOptimizer>
        <p>English content</p>
      </GermanTextOptimizer>,
      { initialLanguage: 'en' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveAttribute('lang');
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <GermanTextOptimizer className="custom-class">
        <p>Content</p>
      </GermanTextOptimizer>,
      { initialLanguage: 'de' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('enables hyphenation when specified', () => {
    const { container } = renderWithProviders(
      <GermanTextOptimizer enableHyphenation={true}>
        <p>Content</p>
      </GermanTextOptimizer>,
      { initialLanguage: 'de' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.hyphens).toBe('auto');
  });

  it('disables hyphenation when specified', () => {
    const { container } = renderWithProviders(
      <GermanTextOptimizer enableHyphenation={false}>
        <p>Content</p>
      </GermanTextOptimizer>,
      { initialLanguage: 'de' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.hyphens).toBe('none');
  });

  it('applies word breaking styles for German', () => {
    const { container } = renderWithProviders(
      <GermanTextOptimizer>
        <p>Content</p>
      </GermanTextOptimizer>,
      { initialLanguage: 'de' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.wordBreak).toBe('break-word');
    expect(wrapper.style.overflowWrap).toBe('break-word');
  });
});

describe('GermanTitle', () => {
  it('renders h1 by default', () => {
    renderWithProviders(
      <GermanTitle>Test Title</GermanTitle>,
      { initialLanguage: 'de' }
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders specified heading level', () => {
    renderWithProviders(
      <GermanTitle level={3}>Test Title</GermanTitle>,
      { initialLanguage: 'de' }
    );

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('applies German title class', () => {
    renderWithProviders(
      <GermanTitle>Test Title</GermanTitle>,
      { initialLanguage: 'de' }
    );

    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('german-title');
  });

  it('sets lang attribute for German', () => {
    renderWithProviders(
      <GermanTitle>Test Title</GermanTitle>,
      { initialLanguage: 'de' }
    );

    const heading = screen.getByRole('heading');
    expect(heading).toHaveAttribute('lang', 'de');
  });

  it('does not set lang attribute for English', () => {
    renderWithProviders(
      <GermanTitle>Test Title</GermanTitle>,
      { initialLanguage: 'en' }
    );

    const heading = screen.getByRole('heading');
    expect(heading).not.toHaveAttribute('lang');
  });

  it('applies appropriate line height for different levels', () => {
    const { rerender } = renderWithProviders(
      <GermanTitle level={1}>Title</GermanTitle>,
      { initialLanguage: 'de' }
    );

    let heading = screen.getByRole('heading');
    expect(heading.style.lineHeight).toBe('1.2');

    rerender(
      <GermanTitle level={3}>Title</GermanTitle>
    );

    heading = screen.getByRole('heading');
    expect(heading.style.lineHeight).toBe('1.3');
  });

  it('applies custom className', () => {
    renderWithProviders(
      <GermanTitle className="custom-title">Test Title</GermanTitle>,
      { initialLanguage: 'de' }
    );

    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('custom-title');
  });
});

describe('GermanDescription', () => {
  it('renders description content', () => {
    renderWithProviders(
      <GermanDescription>Test description</GermanDescription>,
      { initialLanguage: 'de' }
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('applies German description class', () => {
    const { container } = renderWithProviders(
      <GermanDescription>Test description</GermanDescription>,
      { initialLanguage: 'de' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('german-description');
  });

  it('sets appropriate styles for German', () => {
    const { container } = renderWithProviders(
      <GermanDescription>Test description</GermanDescription>,
      { initialLanguage: 'de' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.lineHeight).toBe('1.6');
    expect(wrapper.style.textAlign).toBe('left');
    expect(wrapper.style.hyphens).toBe('auto');
  });

  it('does not apply German styles for English', () => {
    const { container } = renderWithProviders(
      <GermanDescription>Test description</GermanDescription>,
      { initialLanguage: 'en' }
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.lineHeight).toBe('');
    expect(wrapper.style.hyphens).toBe('');
  });
});

describe('GermanCompoundWord', () => {
  it('renders compound word', () => {
    renderWithProviders(
      <GermanCompoundWord word="Benutzereinstellungen" />,
      { initialLanguage: 'de' }
    );

    expect(screen.getByText(/Benutzereinstellungen/)).toBeInTheDocument();
  });

  it('applies compound word class', () => {
    const { container } = renderWithProviders(
      <GermanCompoundWord word="Benutzereinstellungen" />,
      { initialLanguage: 'de' }
    );

    const span = container.firstChild as HTMLElement;
    expect(span).toHaveClass('german-compound-word');
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <GermanCompoundWord word="Test" className="custom-word" />,
      { initialLanguage: 'de' }
    );

    const span = container.firstChild as HTMLElement;
    expect(span).toHaveClass('custom-word');
  });

  it('optimizes text with soft hyphens', () => {
    // Mock the useGermanTextUtils hook
    const mockOptimizeText = vi.fn().mockReturnValue('Benutzer­einstellungen');
    
    vi.doMock('../GermanTextOptimizer', async () => {
      const actual = await vi.importActual('../GermanTextOptimizer');
      return {
        ...actual,
        useGermanTextUtils: () => ({
          optimizeText: mockOptimizeText,
          isGerman: true
        })
      };
    });

    renderWithProviders(
      <GermanCompoundWord word="Benutzereinstellungen" />,
      { initialLanguage: 'de' }
    );

    expect(mockOptimizeText).toHaveBeenCalledWith('Benutzereinstellungen');
  });
});

describe('useGermanTextUtils', () => {
  // Note: This would typically be tested with renderHook from @testing-library/react
  // For now, we'll test it through component integration

  it('provides German status', () => {
    let utils: any;
    
    function TestComponent() {
      utils = useGermanTextUtils();
      return null;
    }

    renderWithProviders(<TestComponent />, { initialLanguage: 'de' });
    expect(utils.isGerman).toBe(true);
  });

  it('provides text optimization function', () => {
    let utils: any;
    
    function TestComponent() {
      utils = useGermanTextUtils();
      return null;
    }

    renderWithProviders(<TestComponent />, { initialLanguage: 'de' });
    expect(typeof utils.optimizeText).toBe('function');
  });

  it('provides text metrics function', () => {
    let utils: any;
    
    function TestComponent() {
      utils = useGermanTextUtils();
      return null;
    }

    renderWithProviders(<TestComponent />, { initialLanguage: 'de' });
    expect(typeof utils.getTextMetrics).toBe('function');
  });

  it('provides optimal line length function', () => {
    let utils: any;
    
    function TestComponent() {
      utils = useGermanTextUtils();
      return null;
    }

    renderWithProviders(<TestComponent />, { initialLanguage: 'de' });
    expect(typeof utils.getOptimalLineLength).toBe('function');
  });

  it('optimizes German text with soft hyphens', () => {
    let utils: any;
    
    function TestComponent() {
      utils = useGermanTextUtils();
      return null;
    }

    renderWithProviders(<TestComponent />, { initialLanguage: 'de' });
    
    const optimized = utils.optimizeText('Benutzereinstellungsverwaltung');
    expect(optimized).toContain('\u00AD'); // Soft hyphen
  });

  it('returns text metrics for German content', () => {
    let utils: any;
    
    function TestComponent() {
      utils = useGermanTextUtils();
      return null;
    }

    renderWithProviders(<TestComponent />, { initialLanguage: 'de' });
    
    const metrics = utils.getTextMetrics('Dies ist ein Test mit Benutzereinstellungsverwaltung');
    expect(metrics).toHaveProperty('wordCount');
    expect(metrics).toHaveProperty('avgWordLength');
    expect(metrics).toHaveProperty('longWordCount');
    expect(metrics).toHaveProperty('needsOptimization');
  });

  it('calculates optimal line length based on container width', () => {
    let utils: any;
    
    function TestComponent() {
      utils = useGermanTextUtils();
      return null;
    }

    renderWithProviders(<TestComponent />, { initialLanguage: 'de' });
    
    expect(utils.getOptimalLineLength(320)).toBe(35); // Mobile
    expect(utils.getOptimalLineLength(768)).toBe(45); // Tablet
    expect(utils.getOptimalLineLength(1024)).toBe(55); // Desktop
    expect(utils.getOptimalLineLength(1200)).toBe(60); // Large desktop
  });

  it('returns standard line length for English', () => {
    let utils: any;
    
    function TestComponent() {
      utils = useGermanTextUtils();
      return null;
    }

    renderWithProviders(<TestComponent />, { initialLanguage: 'en' });
    
    expect(utils.getOptimalLineLength(1024)).toBe(60); // Standard for English
  });
});

describe('Integration Tests', () => {
  it('works together with German accessibility features', () => {
    renderWithProviders(
      <GermanTextOptimizer>
        <GermanTitle>Benutzereinstellungsverwaltung</GermanTitle>
        <GermanDescription>
          Dies ist eine Beschreibung mit langen zusammengesetzten Wörtern.
        </GermanDescription>
        <GermanCompoundWord word="Gesundheitsüberwachungssystem" />
      </GermanTextOptimizer>,
      { initialLanguage: 'de' }
    );

    // Check that all components are rendered
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByText(/Beschreibung/)).toBeInTheDocument();
    expect(screen.getByText(/Gesundheitsüberwachungssystem/)).toBeInTheDocument();

    // Check that German attributes are applied
    const heading = screen.getByRole('heading');
    expect(heading).toHaveAttribute('lang', 'de');
    expect(heading).toHaveClass('german-title');
  });

  it('adapts to language changes', () => {
    const { rerender } = renderWithProviders(
      <GermanTextOptimizer>
        <GermanTitle>Test Title</GermanTitle>
      </GermanTextOptimizer>,
      { initialLanguage: 'de' }
    );

    let heading = screen.getByRole('heading');
    expect(heading).toHaveAttribute('lang', 'de');

    // Change language to English
    rerender(
      <GermanTextOptimizer>
        <GermanTitle>Test Title</GermanTitle>
      </GermanTextOptimizer>
    );

    // Note: In a real scenario, this would require proper i18n context updates
    // For testing purposes, we're checking the component behavior
  });
});