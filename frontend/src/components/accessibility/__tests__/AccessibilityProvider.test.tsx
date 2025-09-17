/**
 * AccessibilityProvider Tests
 * Tests for the accessibility context provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { accessibilityRender, userEvent } from '../../../test/test-utils';
import { AccessibilityProvider, useAccessibilityContext } from '../AccessibilityProvider';

// Test component to access context
const TestComponent = () => {
  const {
    announce,
    isKeyboardUser,
    handleKeyPress,
    skipToContent,
    shouldUseHighContrast,
    prefersReducedMotion,
    breakpoint,
    isMobile,
    language,
  } = useAccessibilityContext();

  return (
    <div>
      <button 
        onClick={() => announce('Test announcement')}
        data-testid="announce-button"
      >
        Announce
      </button>
      <div data-testid="keyboard-user">{isKeyboardUser.toString()}</div>
      <div data-testid="breakpoint">{breakpoint}</div>
      <div data-testid="is-mobile">{isMobile.toString()}</div>
      <div data-testid="language">{language}</div>
      <div data-testid="high-contrast">{shouldUseHighContrast.toString()}</div>
      <div data-testid="reduced-motion">{prefersReducedMotion.toString()}</div>
      <button 
        onClick={skipToContent}
        data-testid="skip-button"
      >
        Skip to Content
      </button>
      <button
        onClick={(e) => handleKeyPress(e as any, () => announce('Key pressed'))}
        data-testid="key-handler-button"
      >
        Handle Key
      </button>
    </div>
  );
};

describe('AccessibilityProvider', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 767px'), // Mock mobile
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('provides accessibility context to children', () => {
    accessibilityRender(<TestComponent />);

    expect(screen.getByTestId('keyboard-user')).toHaveTextContent('false');
    expect(screen.getByTestId('breakpoint')).toBeInTheDocument();
    expect(screen.getByTestId('is-mobile')).toBeInTheDocument();
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
  });

  it('detects keyboard user on keyboard interaction', async () => {
    accessibilityRender(<TestComponent />);

    const button = screen.getByTestId('announce-button');
    
    // Initially not a keyboard user
    expect(screen.getByTestId('keyboard-user')).toHaveTextContent('false');

    // Simulate keyboard interaction
    await userEvent.keyboard('{Tab}');
    
    // Should detect keyboard user after keyboard event
    await waitFor(() => {
      expect(screen.getByTestId('keyboard-user')).toHaveTextContent('true');
    });
  });

  it('makes screen reader announcements', async () => {
    accessibilityRender(<TestComponent />);

    const button = screen.getByTestId('announce-button');
    
    // Click announce button
    await userEvent.click(button);

    // Check that announcement element was created
    await waitFor(() => {
      const announcementElement = document.querySelector('.sr-only[aria-live="polite"]');
      expect(announcementElement).toBeInTheDocument();
    });
  });

  it('handles skip to content functionality', async () => {
    // Add main content element to DOM
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    mainContent.tabIndex = -1;
    document.body.appendChild(mainContent);

    accessibilityRender(<TestComponent />);

    const skipButton = screen.getByTestId('skip-button');
    
    // Mock focus method
    const focusMock = vi.fn();
    mainContent.focus = focusMock;

    await userEvent.click(skipButton);

    expect(focusMock).toHaveBeenCalled();
  });

  it('handles keyboard press events', async () => {
    accessibilityRender(<TestComponent />);

    const keyHandlerButton = screen.getByTestId('key-handler-button');

    // Simulate Enter key press
    fireEvent.keyDown(keyHandlerButton, { key: 'Enter' });

    // Should create announcement for key press
    await waitFor(() => {
      const announcementElement = document.querySelector('.sr-only[aria-live="polite"]');
      expect(announcementElement).toBeInTheDocument();
    });
  });

  it('detects reduced motion preference', () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    accessibilityRender(<TestComponent />);

    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
  });

  it('detects high contrast preference', () => {
    // Mock prefers-contrast high
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    accessibilityRender(<TestComponent />);

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
  });

  it('applies accessibility classes to document root', () => {
    const root = document.documentElement;
    
    accessibilityRender(<TestComponent />);

    // Should apply mobile class based on mock
    expect(root.classList.contains('mobile')).toBe(true);
  });

  it('creates skip link on mount', () => {
    accessibilityRender(<TestComponent />);

    const skipLink = document.getElementById('skip-to-content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveClass('skip-link');
  });

  it('handles global keyboard shortcuts', async () => {
    // Add main content for skip functionality
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    mainContent.tabIndex = -1;
    document.body.appendChild(mainContent);

    accessibilityRender(<TestComponent />);

    // Mock focus method
    const focusMock = vi.fn();
    mainContent.focus = focusMock;

    // Test Alt+S shortcut
    fireEvent.keyDown(document, { key: 's', altKey: true });

    expect(focusMock).toHaveBeenCalled();
  });

  it('updates context when responsive breakpoint changes', async () => {
    // Start with mobile
    let isMobile = true;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 767px') && isMobile,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event, handler) => {
          // Store handler for later trigger
          (window as any).mediaQueryHandler = handler;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    accessibilityRender(<TestComponent />);

    expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');

    // Change to desktop
    isMobile = false;
    if ((window as any).mediaQueryHandler) {
      (window as any).mediaQueryHandler({ matches: false });
    }

    // Should update responsive context
    await waitFor(() => {
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
    });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      accessibilityRender(<TestComponent />, { wrapper: undefined });
    }).toThrow('useAccessibilityContext must be used within AccessibilityProvider');

    consoleSpy.mockRestore();
  });
});