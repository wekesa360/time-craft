/**
 * Comprehensive Accessibility Provider
 * Context provider for application-wide accessibility features
 */

import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useResponsive } from '../../hooks/useResponsive';

interface AccessibilityContextType {
  // Focus management
  saveFocus: () => void;
  restoreFocus: () => void;
  trapFocus: (container: HTMLElement) => (() => void) | undefined;
  
  // Screen reader
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceNavigation: (route: string, title: string) => void;
  announceError: (error: string) => void;
  announceSuccess: (success: string) => void;
  
  // Keyboard navigation
  isKeyboardUser: boolean;
  handleKeyPress: (event: React.KeyboardEvent, action: () => void, keys?: string[]) => void;
  skipToContent: () => void;
  
  // Accessibility preferences
  shouldUseHighContrast: boolean;
  prefersReducedMotion: boolean;
  isForcedColors: boolean;
  
  // Form validation
  validateField: (field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, isValid: boolean, errorMessage: string) => void;
  
  // Responsive context
  breakpoint: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Language
  language: string;
  isRTL: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibilityContext = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const accessibility = useAccessibility();
  const responsive = useResponsive();
  
  // RTL language detection
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const isRTL = rtlLanguages.includes(i18n.language);

  // Apply global accessibility styles
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast styles
    if (accessibility.shouldUseHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply forced colors styles
    if (accessibility.isForcedColors) {
      root.classList.add('forced-colors');
    } else {
      root.classList.remove('forced-colors');
    }
    
    // Apply reduced motion
    if (accessibility.prefersReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Apply keyboard user styles
    if (accessibility.isKeyboardUser) {
      root.classList.add('keyboard-user');
    } else {
      root.classList.remove('keyboard-user');
    }
    
    // Apply RTL direction
    if (isRTL) {
      root.dir = 'rtl';
      root.classList.add('rtl');
    } else {
      root.dir = 'ltr';
      root.classList.remove('rtl');
    }
    
    // Apply responsive classes
    root.classList.add(`breakpoint-${responsive.breakpoint}`);
    root.classList.toggle('mobile', responsive.isMobile);
    root.classList.toggle('tablet', responsive.isTablet);
    root.classList.toggle('desktop', responsive.isDesktop);
    
    // Cleanup previous breakpoint classes
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    breakpoints.forEach(bp => {
      if (bp !== responsive.breakpoint) {
        root.classList.remove(`breakpoint-${bp}`);
      }
    });
    
  }, [
    accessibility.shouldUseHighContrast,
    accessibility.isForcedColors,
    accessibility.prefersReducedMotion,
    accessibility.isKeyboardUser,
    responsive.breakpoint,
    responsive.isMobile,
    responsive.isTablet,
    responsive.isDesktop,
    isRTL
  ]);

  // Add skip to content link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let skipLink = document.getElementById('skip-to-content') as HTMLAnchorElement | null;
    if (!skipLink) {
      skipLink = document.createElement('a');
      skipLink.id = 'skip-to-content';
      skipLink.href = '#main-content';
      skipLink.className = 'skip-link';
      skipLink.textContent = i18n.language === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content';
      
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        accessibility.skipToContent();
      });
      
      document.body.insertBefore(skipLink, document.body.firstChild);
    } else {
      // Update text if language changed
      skipLink.textContent = i18n.language === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content';
    }
    
    return () => {
      if (skipLink?.parentNode) {
        skipLink.parentNode.removeChild(skipLink);
      }
    };
  }, [i18n.language, accessibility.skipToContent]);

  // Add global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Skip to content (Alt + S)
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        accessibility.skipToContent();
        accessibility.announce(
          i18n.language === 'de' ? 'Zum Hauptinhalt gesprungen' : 'Skipped to main content'
        );
      }
      
      // Open accessibility menu (Alt + A)
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        const accessibilityButton = document.querySelector('[data-accessibility-menu]') as HTMLElement;
        if (accessibilityButton) {
          accessibilityButton.click();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [accessibility.skipToContent, accessibility.announce, i18n.language]);

  const contextValue: AccessibilityContextType = {
    // Focus management
    saveFocus: accessibility.saveFocus,
    restoreFocus: accessibility.restoreFocus,
    trapFocus: accessibility.trapFocus,
    
    // Screen reader
    announce: accessibility.announce,
    announceNavigation: accessibility.announceNavigation,
    announceError: accessibility.announceError,
    announceSuccess: accessibility.announceSuccess,
    
    // Keyboard navigation
    isKeyboardUser: accessibility.isKeyboardUser,
    handleKeyPress: accessibility.handleKeyPress,
    skipToContent: accessibility.skipToContent,
    
    // Accessibility preferences
    shouldUseHighContrast: accessibility.shouldUseHighContrast,
    prefersReducedMotion: accessibility.prefersReducedMotion,
    isForcedColors: accessibility.isForcedColors,
    
    // Form validation
    validateField: accessibility.validateField,
    
    // Responsive context
    breakpoint: responsive.breakpoint,
    isMobile: responsive.isMobile,
    isTablet: responsive.isTablet,
    isDesktop: responsive.isDesktop,
    
    // Language
    language: i18n.language,
    isRTL,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};