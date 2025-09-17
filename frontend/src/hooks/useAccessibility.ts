/**
 * Accessibility Hooks
 * React hooks for enhanced accessibility features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Hook for managing focus
export const useFocusManagement = () => {
  const previousFocus = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
      previousFocus.current.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return {
    saveFocus,
    restoreFocus,
    trapFocus,
  };
};

// Hook for screen reader announcements
export const useScreenReader = () => {
  const { i18n } = useTranslation();
  
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }, []);

  const announceNavigation = useCallback((route: string, title: string) => {
    const message = i18n.language === 'de' 
      ? `Navigation zu ${title}`
      : `Navigated to ${title}`;
    announce(message, 'assertive');
  }, [announce, i18n.language]);

  const announceError = useCallback((error: string) => {
    const message = i18n.language === 'de'
      ? `Fehler: ${error}`
      : `Error: ${error}`;
    announce(message, 'assertive');
  }, [announce, i18n.language]);

  const announceSuccess = useCallback((success: string) => {
    const message = i18n.language === 'de'
      ? `Erfolgreich: ${success}`
      : `Success: ${success}`;
    announce(message, 'polite');
  }, [announce, i18n.language]);

  return {
    announce,
    announceNavigation,
    announceError,
    announceSuccess,
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = () => setIsKeyboardUser(true);
    const handleMouseDown = () => setIsKeyboardUser(false);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleKeyPress = useCallback((
    event: React.KeyboardEvent,
    action: () => void,
    keys: string[] = ['Enter', ' ']
  ) => {
    if (keys.includes(event.key)) {
      event.preventDefault();
      action();
    }
  }, []);

  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    isKeyboardUser,
    handleKeyPress,
    skipToContent,
  };
};

// Hook for high contrast mode detection
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isForcedColors, setIsForcedColors] = useState(false);

  useEffect(() => {
    // Check for forced colors (Windows High Contrast)
    const checkForcedColors = () => {
      if (window.matchMedia) {
        const forcedColors = window.matchMedia('(forced-colors: active)');
        setIsForcedColors(forcedColors.matches);
        
        const highContrast = window.matchMedia('(prefers-contrast: high)');
        setIsHighContrast(highContrast.matches);

        forcedColors.addEventListener('change', (e) => setIsForcedColors(e.matches));
        highContrast.addEventListener('change', (e) => setIsHighContrast(e.matches));

        return () => {
          forcedColors.removeEventListener('change', (e) => setIsForcedColors(e.matches));
          highContrast.removeEventListener('change', (e) => setIsHighContrast(e.matches));
        };
      }
    };

    checkForcedColors();
  }, []);

  return {
    isHighContrast,
    isForcedColors,
    shouldUseHighContrast: isHighContrast || isForcedColors,
  };
};

// Hook for reduced motion preference
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Hook for accessible form validation
export const useAccessibleForm = () => {
  const { announce } = useScreenReader();

  const validateField = useCallback((
    field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    isValid: boolean,
    errorMessage: string
  ) => {
    const errorId = `${field.id}-error`;
    let errorElement = document.getElementById(errorId);

    if (!isValid) {
      // Create or update error message
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = errorId;
        errorElement.className = 'text-red-500 text-sm mt-1';
        errorElement.setAttribute('role', 'alert');
        field.parentNode?.appendChild(errorElement);
      }
      errorElement.textContent = errorMessage;
      
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', errorId);
      announce(errorMessage, 'assertive');
    } else {
      // Remove error message
      if (errorElement) {
        errorElement.remove();
      }
      field.setAttribute('aria-invalid', 'false');
      field.removeAttribute('aria-describedby');
    }
  }, [announce]);

  return {
    validateField,
  };
};

// Hook for accessible data visualization
export const useAccessibleChart = () => {
  const { i18n } = useTranslation();

  const generateChartDescription = useCallback((
    title: string,
    data: Array<{ label: string; value: number }>,
    chartType: 'bar' | 'line' | 'pie' = 'bar'
  ) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const max = Math.max(...data.map(item => item.value));
    const maxItem = data.find(item => item.value === max);

    const description = i18n.language === 'de' 
      ? `${chartType === 'pie' ? 'Kreisdiagramm' : chartType === 'line' ? 'Liniendiagramm' : 'Balkendiagramm'}: ${title}. ${data.length} Datenpunkte. Höchster Wert: ${maxItem?.label} mit ${max}. Gesamtwert: ${total}.`
      : `${chartType} chart: ${title}. ${data.length} data points. Highest value: ${maxItem?.label} at ${max}. Total: ${total}.`;

    return description;
  }, [i18n.language]);

  const getChartKeyboardInstructions = useCallback(() => {
    return i18n.language === 'de'
      ? 'Verwenden Sie die Pfeiltasten, um durch die Datenpunkte zu navigieren. Drücken Sie Enter für Details.'
      : 'Use arrow keys to navigate through data points. Press Enter for details.';
  }, [i18n.language]);

  return {
    generateChartDescription,
    getChartKeyboardInstructions,
  };
};

// Hook for modal accessibility
export const useAccessibleModal = (isOpen: boolean, title: string) => {
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();
  const { announce } = useScreenReader();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      announce(
        i18n.language === 'de' ? `Dialog geöffnet: ${title}` : `Dialog opened: ${title}`,
        'assertive'
      );
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Find modal container and trap focus
      const modalContainer = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modalContainer) {
        const cleanup = trapFocus(modalContainer);
        return cleanup;
      }
    } else {
      restoreFocus();
      document.body.style.overflow = '';
      announce(
        i18n.language === 'de' ? 'Dialog geschlossen' : 'Dialog closed',
        'polite'
      );
    }
  }, [isOpen, title, saveFocus, restoreFocus, trapFocus, announce, i18n.language]);

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      // Let the parent handle the close action
      const escapeEvent = new CustomEvent('modal-escape');
      document.dispatchEvent(escapeEvent);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);

  return {
    modalProps: {
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': `${title}-title`,
      'aria-describedby': `${title}-description`,
    },
    titleProps: {
      id: `${title}-title`,
    },
    descriptionProps: {
      id: `${title}-description`,
    },
  };
};

// Hook for accessible tooltips
export const useAccessibleTooltip = (content: string, delay: number = 1000) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isVisible,
    showTooltip,
    hideTooltip,
    tooltipProps: {
      role: 'tooltip',
      'aria-hidden': !isVisible,
    },
    triggerProps: {
      'aria-describedby': isVisible ? 'tooltip' : undefined,
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
      onFocus: showTooltip,
      onBlur: hideTooltip,
    },
  };
};

// Comprehensive accessibility hook
export const useAccessibility = () => {
  const focusManagement = useFocusManagement();
  const screenReader = useScreenReader();
  const keyboardNavigation = useKeyboardNavigation();
  const highContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const accessibleForm = useAccessibleForm();
  const accessibleChart = useAccessibleChart();

  return {
    ...focusManagement,
    ...screenReader,
    ...keyboardNavigation,
    ...highContrast,
    prefersReducedMotion,
    ...accessibleForm,
    ...accessibleChart,
    
    // Utility function to get all accessibility context
    getAccessibilityContext: () => ({
      isKeyboardUser: keyboardNavigation.isKeyboardUser,
      shouldUseHighContrast: highContrast.shouldUseHighContrast,
      prefersReducedMotion,
      isForcedColors: highContrast.isForcedColors,
    }),
  };
};