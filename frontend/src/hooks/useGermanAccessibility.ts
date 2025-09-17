import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  germanAccessibility, 
  getGermanAccessibilityStatus 
} from '../utils/germanAccessibility';
import type { GermanAccessibilityConfig } from '../utils/germanAccessibility';

export interface UseGermanAccessibilityOptions extends GermanAccessibilityConfig {
  autoInitialize?: boolean;
  watchLanguageChanges?: boolean;
}

export const useGermanAccessibility = (options: UseGermanAccessibilityOptions = {}) => {
  const { i18n } = useTranslation();
  const {
    autoInitialize = true,
    watchLanguageChanges = true,
    ...accessibilityConfig
  } = options;

  const [accessibilityStatus, setAccessibilityStatus] = useState(() => 
    getGermanAccessibilityStatus()
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const previousLanguage = useRef(i18n.language);

  // Initialize accessibility features
  const initializeAccessibility = () => {
    germanAccessibility.updateConfig(accessibilityConfig);
    germanAccessibility.initialize(i18n.language);
    setAccessibilityStatus(getGermanAccessibilityStatus());
    setIsInitialized(true);
  };

  // Update language and announce change
  const updateLanguage = (newLanguage: string) => {
    const languageNames = {
      'en': 'English',
      'de': 'Deutsch'
    };
    
    germanAccessibility.updateLanguage(newLanguage);
    germanAccessibility.announceLanguageChange(
      newLanguage, 
      languageNames[newLanguage as keyof typeof languageNames] || newLanguage
    );
    setAccessibilityStatus(getGermanAccessibilityStatus());
  };

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initializeAccessibility();
    }

    return () => {
      germanAccessibility.cleanup();
    };
  }, [autoInitialize]);

  // Watch for language changes
  useEffect(() => {
    if (watchLanguageChanges && isInitialized && previousLanguage.current !== i18n.language) {
      updateLanguage(i18n.language);
      previousLanguage.current = i18n.language;
    }
  }, [i18n.language, watchLanguageChanges, isInitialized]);

  // Update accessibility status when environment changes
  useEffect(() => {
    const updateStatus = () => {
      setAccessibilityStatus(getGermanAccessibilityStatus());
    };

    // Listen for media query changes
    const mediaQueries = [
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(forced-colors: active)')
    ];

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', updateStatus);
    });

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', updateStatus);
      });
    };
  }, []);

  return {
    accessibilityStatus,
    isInitialized,
    initializeAccessibility,
    updateLanguage,
    isGerman: i18n.language === 'de'
  };
};

// Hook for components that need German accessibility features
export const useGermanAccessibilityFeatures = () => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  // Add German ARIA labels to an element
  const addGermanAriaLabels = (element: HTMLElement, labels: Record<string, string>) => {
    if (!isGerman) return;

    Object.entries(labels).forEach(([attribute, value]) => {
      element.setAttribute(attribute, value);
    });
  };

  // Create German screen reader announcement
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  };

  // Get German accessibility attributes for common UI elements
  const getGermanAccessibilityAttributes = (elementType: string) => {
    if (!isGerman) return {};

    const attributes: Record<string, Record<string, string>> = {
      button: {
        'aria-label': 'Schaltfläche',
      },
      input: {
        'aria-describedby': 'Eingabefeld',
      },
      select: {
        'aria-label': 'Auswahl',
      },
      textarea: {
        'aria-label': 'Textbereich',
      },
      modal: {
        'aria-label': 'Dialog',
        'role': 'dialog',
        'aria-modal': 'true'
      },
      navigation: {
        'aria-label': 'Navigation',
        'role': 'navigation'
      },
      main: {
        'aria-label': 'Hauptinhalt',
        'role': 'main'
      },
      search: {
        'aria-label': 'Suche',
        'role': 'search'
      }
    };

    return attributes[elementType] || {};
  };

  // Check if element needs German accessibility enhancements
  const needsGermanAccessibility = (element: HTMLElement): boolean => {
    if (!isGerman) return false;

    const textContent = element.textContent || '';
    const hasLongWords = textContent.split(' ').some(word => word.length > 15);
    const hasCompoundWords = /\b\w{15,}\b/.test(textContent);
    const isInteractive = element.matches('button, input, select, textarea, a, [tabindex]');

    return hasLongWords || hasCompoundWords || isInteractive;
  };

  return {
    isGerman,
    addGermanAriaLabels,
    announceToScreenReader,
    getGermanAccessibilityAttributes,
    needsGermanAccessibility
  };
};

// Hook for keyboard navigation enhancements
export const useGermanKeyboardNavigation = () => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  useEffect(() => {
    if (!isGerman) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Enhanced keyboard navigation for German interface
      if (event.altKey && event.key === 'h') {
        // Alt+H: Go to main content (Hauptinhalt)
        event.preventDefault();
        const mainContent = document.getElementById('main-content') || document.querySelector('main');
        if (mainContent) {
          (mainContent as HTMLElement).focus();
        }
      }

      if (event.altKey && event.key === 'n') {
        // Alt+N: Go to navigation (Navigation)
        event.preventDefault();
        const navigation = document.getElementById('navigation') || document.querySelector('nav');
        if (navigation) {
          (navigation as HTMLElement).focus();
        }
      }

      if (event.altKey && event.key === 's') {
        // Alt+S: Go to search (Suche)
        event.preventDefault();
        const search = document.querySelector('[role="search"] input, input[type="search"]');
        if (search) {
          (search as HTMLElement).focus();
        }
      }

      if (event.altKey && event.key === 'm') {
        // Alt+M: Open menu (Menü)
        event.preventDefault();
        const menu = document.querySelector('[aria-label="Menü"], [aria-label="Menu"]');
        if (menu) {
          (menu as HTMLElement).click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGerman]);

  return {
    isGerman,
    keyboardShortcuts: isGerman ? {
      'Alt+H': 'Zum Hauptinhalt springen',
      'Alt+N': 'Zur Navigation springen',
      'Alt+S': 'Zur Suche springen',
      'Alt+M': 'Menü öffnen'
    } : {}
  };
};

// Hook for high contrast mode support
export const useGermanHighContrast = () => {
  const { i18n } = useTranslation();
  const [isHighContrast, setIsHighContrast] = useState(
    () => window.matchMedia('(prefers-contrast: high)').matches
  );
  const [isForcedColors, setIsForcedColors] = useState(
    () => window.matchMedia('(forced-colors: active)').matches
  );

  useEffect(() => {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    const handleForcedColorsChange = (e: MediaQueryListEvent) => {
      setIsForcedColors(e.matches);
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);
    forcedColorsQuery.addEventListener('change', handleForcedColorsChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      forcedColorsQuery.removeEventListener('change', handleForcedColorsChange);
    };
  }, []);

  const getHighContrastStyles = (isGerman: boolean = i18n.language === 'de') => {
    if (!isHighContrast && !isForcedColors) return {};

    return {
      ...(isGerman && {
        color: isHighContrast ? '#000000' : 'ButtonText',
        backgroundColor: isHighContrast ? '#ffffff' : 'ButtonFace',
        border: `2px solid ${isHighContrast ? '#000000' : 'ButtonText'}`,
        fontWeight: isHighContrast ? 'bold' : 'normal'
      })
    };
  };

  return {
    isHighContrast,
    isForcedColors,
    isGerman: i18n.language === 'de',
    getHighContrastStyles,
    needsHighContrastSupport: isHighContrast || isForcedColors
  };
};