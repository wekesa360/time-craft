import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  useGermanAccessibility,
  useGermanAccessibilityFeatures,
  useGermanKeyboardNavigation,
  useGermanHighContrast
} from '../useGermanAccessibility';
import i18n from '../../i18n';

// Mock the German accessibility utilities
vi.mock('../../utils/germanAccessibility', () => ({
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

// Mock DOM methods
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockMatchMedia = vi.fn();
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock window methods
  Object.defineProperty(global, 'window', {
    value: {
      matchMedia: mockMatchMedia,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener
    },
    writable: true
  });

  // Mock document methods
  Object.defineProperty(global, 'document', {
    value: {
      createElement: mockCreateElement,
      body: { appendChild: mockAppendChild },
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener
    },
    writable: true
  });

  // Mock media query
  mockMatchMedia.mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  });

  // Mock element creation
  mockCreateElement.mockReturnValue({
    className: '',
    textContent: '',
    setAttribute: vi.fn()
  });

  // Set i18n language to German for tests
  i18n.changeLanguage('de');
});

afterEach(() => {
  vi.restoreAllMocks();
  i18n.changeLanguage('en'); // Reset to English
});

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

describe('useGermanAccessibility', () => {
  it('initializes with default options', () => {
    const { result } = renderHook(() => useGermanAccessibility(), {
      wrapper: TestWrapper
    });

    expect(result.current.isGerman).toBe(true);
    expect(result.current.accessibilityStatus).toBeDefined();
  });

  it('initializes with custom options', () => {
    const options = {
      enableScreenReaderSupport: false,
      enableKeyboardNavigation: true,
      enableHighContrastMode: false
    };

    const { result } = renderHook(() => useGermanAccessibility(options), {
      wrapper: TestWrapper
    });

    expect(result.current.isGerman).toBe(true);
  });

  it('auto-initializes when autoInitialize is true', () => {
    const { germanAccessibility } = require('../../utils/germanAccessibility');
    
    renderHook(() => useGermanAccessibility({ autoInitialize: true }), {
      wrapper: TestWrapper
    });

    expect(germanAccessibility.initialize).toHaveBeenCalledWith('de');
  });

  it('does not auto-initialize when autoInitialize is false', () => {
    const { germanAccessibility } = require('../../utils/germanAccessibility');
    
    renderHook(() => useGermanAccessibility({ autoInitialize: false }), {
      wrapper: TestWrapper
    });

    expect(germanAccessibility.initialize).not.toHaveBeenCalled();
  });

  it('watches for language changes', async () => {
    const { germanAccessibility } = require('../../utils/germanAccessibility');
    
    const { rerender } = renderHook(() => useGermanAccessibility(), {
      wrapper: TestWrapper
    });

    // Change language
    await act(async () => {
      i18n.changeLanguage('en');
    });

    rerender();

    expect(germanAccessibility.updateLanguage).toHaveBeenCalledWith('en');
  });

  it('provides initializeAccessibility function', () => {
    const { result } = renderHook(() => useGermanAccessibility(), {
      wrapper: TestWrapper
    });

    expect(typeof result.current.initializeAccessibility).toBe('function');
    
    act(() => {
      result.current.initializeAccessibility();
    });

    const { germanAccessibility } = require('../../utils/germanAccessibility');
    expect(germanAccessibility.initialize).toHaveBeenCalled();
  });

  it('provides updateLanguage function', () => {
    const { result } = renderHook(() => useGermanAccessibility(), {
      wrapper: TestWrapper
    });

    expect(typeof result.current.updateLanguage).toBe('function');
    
    act(() => {
      result.current.updateLanguage('en');
    });

    const { germanAccessibility } = require('../../utils/germanAccessibility');
    expect(germanAccessibility.updateLanguage).toHaveBeenCalledWith('en');
    expect(germanAccessibility.announceLanguageChange).toHaveBeenCalledWith('en', 'English');
  });

  it('cleans up on unmount', () => {
    const { germanAccessibility } = require('../../utils/germanAccessibility');
    
    const { unmount } = renderHook(() => useGermanAccessibility(), {
      wrapper: TestWrapper
    });

    unmount();

    expect(germanAccessibility.cleanup).toHaveBeenCalled();
  });

  it('updates accessibility status on media query changes', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    renderHook(() => useGermanAccessibility(), {
      wrapper: TestWrapper
    });

    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(mockMatchMedia).toHaveBeenCalledWith('(forced-colors: active)');
  });
});

describe('useGermanAccessibilityFeatures', () => {
  it('returns German status correctly', () => {
    const { result } = renderHook(() => useGermanAccessibilityFeatures(), {
      wrapper: TestWrapper
    });

    expect(result.current.isGerman).toBe(true);
  });

  it('returns English status correctly', async () => {
    await act(async () => {
      i18n.changeLanguage('en');
    });

    const { result } = renderHook(() => useGermanAccessibilityFeatures(), {
      wrapper: TestWrapper
    });

    expect(result.current.isGerman).toBe(false);
  });

  it('provides addGermanAriaLabels function', () => {
    const { result } = renderHook(() => useGermanAccessibilityFeatures(), {
      wrapper: TestWrapper
    });

    const mockElement = {
      setAttribute: vi.fn()
    };

    const labels = {
      'aria-label': 'Test Label',
      'aria-describedby': 'Test Description'
    };

    act(() => {
      result.current.addGermanAriaLabels(mockElement as any, labels);
    });

    expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'Test Label');
    expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-describedby', 'Test Description');
  });

  it('does not add ARIA labels for non-German language', async () => {
    await act(async () => {
      i18n.changeLanguage('en');
    });

    const { result } = renderHook(() => useGermanAccessibilityFeatures(), {
      wrapper: TestWrapper
    });

    const mockElement = {
      setAttribute: vi.fn()
    };

    act(() => {
      result.current.addGermanAriaLabels(mockElement as any, { 'aria-label': 'Test' });
    });

    expect(mockElement.setAttribute).not.toHaveBeenCalled();
  });

  it('provides announceToScreenReader function', () => {
    const { result } = renderHook(() => useGermanAccessibilityFeatures(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.announceToScreenReader('Test message');
    });

    expect(mockCreateElement).toHaveBeenCalledWith('div');
    expect(mockAppendChild).toHaveBeenCalled();
  });

  it('provides getGermanAccessibilityAttributes function', () => {
    const { result } = renderHook(() => useGermanAccessibilityFeatures(), {
      wrapper: TestWrapper
    });

    const attributes = result.current.getGermanAccessibilityAttributes('button');
    expect(attributes).toHaveProperty('aria-label');
  });

  it('returns empty attributes for non-German language', async () => {
    await act(async () => {
      i18n.changeLanguage('en');
    });

    const { result } = renderHook(() => useGermanAccessibilityFeatures(), {
      wrapper: TestWrapper
    });

    const attributes = result.current.getGermanAccessibilityAttributes('button');
    expect(Object.keys(attributes)).toHaveLength(0);
  });

  it('provides needsGermanAccessibility function', () => {
    const { result } = renderHook(() => useGermanAccessibilityFeatures(), {
      wrapper: TestWrapper
    });

    const mockElement = {
      textContent: 'Benutzereinstellungsverwaltung',
      matches: vi.fn().mockReturnValue(false)
    };

    const needs = result.current.needsGermanAccessibility(mockElement as any);
    expect(needs).toBe(true);
  });

  it('returns false for non-German language in needsGermanAccessibility', async () => {
    await act(async () => {
      i18n.changeLanguage('en');
    });

    const { result } = renderHook(() => useGermanAccessibilityFeatures(), {
      wrapper: TestWrapper
    });

    const mockElement = {
      textContent: 'Long compound word',
      matches: vi.fn().mockReturnValue(false)
    };

    const needs = result.current.needsGermanAccessibility(mockElement as any);
    expect(needs).toBe(false);
  });
});

describe('useGermanKeyboardNavigation', () => {
  it('sets up keyboard event listeners for German language', () => {
    renderHook(() => useGermanKeyboardNavigation(), {
      wrapper: TestWrapper
    });

    expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('does not set up keyboard listeners for non-German language', async () => {
    await act(async () => {
      i18n.changeLanguage('en');
    });

    renderHook(() => useGermanKeyboardNavigation(), {
      wrapper: TestWrapper
    });

    expect(mockAddEventListener).not.toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('returns German keyboard shortcuts', () => {
    const { result } = renderHook(() => useGermanKeyboardNavigation(), {
      wrapper: TestWrapper
    });

    expect(result.current.keyboardShortcuts).toHaveProperty('Alt+H');
    expect(result.current.keyboardShortcuts['Alt+H']).toBe('Zum Hauptinhalt springen');
  });

  it('returns empty shortcuts for non-German language', async () => {
    await act(async () => {
      i18n.changeLanguage('en');
    });

    const { result } = renderHook(() => useGermanKeyboardNavigation(), {
      wrapper: TestWrapper
    });

    expect(Object.keys(result.current.keyboardShortcuts)).toHaveLength(0);
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useGermanKeyboardNavigation(), {
      wrapper: TestWrapper
    });

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('handles keyboard shortcuts correctly', () => {
    const mockFocus = vi.fn();
    const mockClick = vi.fn();
    
    // Mock document.querySelector
    Object.defineProperty(global.document, 'querySelector', {
      value: vi.fn().mockImplementation((selector) => {
        if (selector.includes('main')) {
          return { focus: mockFocus };
        }
        if (selector.includes('nav')) {
          return { focus: mockFocus };
        }
        if (selector.includes('search')) {
          return { focus: mockFocus };
        }
        if (selector.includes('Menü')) {
          return { click: mockClick };
        }
        return null;
      }),
      writable: true
    });

    let keydownHandler: (event: KeyboardEvent) => void;
    mockAddEventListener.mockImplementation((event, handler) => {
      if (event === 'keydown') {
        keydownHandler = handler;
      }
    });

    renderHook(() => useGermanKeyboardNavigation(), {
      wrapper: TestWrapper
    });

    // Test Alt+H (Hauptinhalt)
    act(() => {
      keydownHandler(new KeyboardEvent('keydown', { altKey: true, key: 'h' }));
    });

    expect(mockFocus).toHaveBeenCalled();
  });
});

describe('useGermanHighContrast', () => {
  it('detects high contrast mode', () => {
    mockMatchMedia.mockImplementation((query) => ({
      matches: query.includes('prefers-contrast: high'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    const { result } = renderHook(() => useGermanHighContrast(), {
      wrapper: TestWrapper
    });

    expect(result.current.isHighContrast).toBe(true);
  });

  it('detects forced colors mode', () => {
    mockMatchMedia.mockImplementation((query) => ({
      matches: query.includes('forced-colors: active'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    const { result } = renderHook(() => useGermanHighContrast(), {
      wrapper: TestWrapper
    });

    expect(result.current.isForcedColors).toBe(true);
  });

  it('provides high contrast styles for German', () => {
    mockMatchMedia.mockImplementation((query) => ({
      matches: query.includes('prefers-contrast: high'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    const { result } = renderHook(() => useGermanHighContrast(), {
      wrapper: TestWrapper
    });

    const styles = result.current.getHighContrastStyles(true);
    expect(styles).toHaveProperty('color');
    expect(styles).toHaveProperty('backgroundColor');
    expect(styles).toHaveProperty('border');
  });

  it('returns empty styles when not in high contrast mode', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useGermanHighContrast(), {
      wrapper: TestWrapper
    });

    const styles = result.current.getHighContrastStyles(true);
    expect(Object.keys(styles)).toHaveLength(0);
  });

  it('listens for media query changes', () => {
    const mockAddListener = vi.fn();
    const mockRemoveListener = vi.fn();
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddListener,
      removeEventListener: mockRemoveListener
    });

    const { unmount } = renderHook(() => useGermanHighContrast(), {
      wrapper: TestWrapper
    });

    expect(mockAddListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(mockRemoveListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('updates state when media query changes', () => {
    let changeHandler: (e: MediaQueryListEvent) => void;
    
    const mockAddListener = vi.fn().mockImplementation((event, handler) => {
      if (event === 'change') {
        changeHandler = handler;
      }
    });

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddListener,
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useGermanHighContrast(), {
      wrapper: TestWrapper
    });

    expect(result.current.isHighContrast).toBe(false);

    // Simulate media query change
    act(() => {
      changeHandler({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current.isHighContrast).toBe(true);
  });
});