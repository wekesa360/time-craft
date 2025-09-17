import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  useGermanAccessibility, 
  useGermanKeyboardNavigation, 
  useGermanHighContrast 
} from '../../hooks/useGermanAccessibility';

interface GermanAccessibilityContextType {
  isGerman: boolean;
  accessibilityStatus: ReturnType<typeof useGermanAccessibility>['accessibilityStatus'];
  keyboardShortcuts: Record<string, string>;
  isHighContrast: boolean;
  isForcedColors: boolean;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  getAccessibilityAttributes: (elementType: string) => Record<string, string>;
}

const GermanAccessibilityContext = createContext<GermanAccessibilityContextType | null>(null);

export const useGermanAccessibilityContext = () => {
  const context = useContext(GermanAccessibilityContext);
  if (!context) {
    throw new Error('useGermanAccessibilityContext must be used within GermanAccessibilityProvider');
  }
  return context;
};

interface GermanAccessibilityProviderProps {
  children: React.ReactNode;
  enableKeyboardShortcuts?: boolean;
  enableHighContrastMode?: boolean;
  enableScreenReaderSupport?: boolean;
}

export const GermanAccessibilityProvider: React.FC<GermanAccessibilityProviderProps> = ({
  children,
  enableKeyboardShortcuts = true,
  enableHighContrastMode = true,
  enableScreenReaderSupport = true
}) => {
  const { i18n } = useTranslation();
  
  // Initialize German accessibility
  const { accessibilityStatus, isGerman } = useGermanAccessibility({
    enableKeyboardNavigation: enableKeyboardShortcuts,
    enableHighContrastMode,
    enableScreenReaderSupport,
    enableAriaLabels: true,
    announceLanguageChanges: true
  });

  // Keyboard navigation
  const { keyboardShortcuts } = useGermanKeyboardNavigation();

  // High contrast support
  const { isHighContrast, isForcedColors } = useGermanHighContrast();

  // Screen reader announcements
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

  // Get accessibility attributes for elements
  const getAccessibilityAttributes = (elementType: string): Record<string, string> => {
    if (!isGerman) return {};

    const attributes: Record<string, Record<string, string>> = {
      button: {
        'aria-label': 'Schaltfläche'
      },
      input: {
        'aria-describedby': 'Eingabefeld'
      },
      select: {
        'aria-label': 'Auswahl'
      },
      textarea: {
        'aria-label': 'Textbereich'
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
      },
      form: {
        'aria-label': 'Formular',
        'role': 'form'
      },
      banner: {
        'aria-label': 'Banner',
        'role': 'banner'
      },
      contentinfo: {
        'aria-label': 'Fußzeile',
        'role': 'contentinfo'
      }
    };

    return attributes[elementType] || {};
  };

  const contextValue: GermanAccessibilityContextType = {
    isGerman,
    accessibilityStatus,
    keyboardShortcuts,
    isHighContrast,
    isForcedColors,
    announceToScreenReader,
    getAccessibilityAttributes
  };

  return (
    <GermanAccessibilityContext.Provider value={contextValue}>
      {children}
    </GermanAccessibilityContext.Provider>
  );
};

// Accessible German Button Component
export const GermanAccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}> = ({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false, 
  className = '', 
  ariaLabel,
  ariaDescribedBy 
}) => {
  const { isGerman, getAccessibilityAttributes, isHighContrast } = useGermanAccessibilityContext();
  
  const accessibilityAttrs = getAccessibilityAttributes('button');
  
  const buttonStyles = {
    ...(isHighContrast && isGerman && {
      border: '2px solid #000000',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontWeight: 'bold'
    })
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${isGerman ? 'german-accessible-button' : ''}`}
      style={buttonStyles}
      aria-label={ariaLabel || (isGerman ? accessibilityAttrs['aria-label'] : undefined)}
      aria-describedby={ariaDescribedBy}
      {...(isGerman && accessibilityAttrs)}
    >
      {children}
    </button>
  );
};

// Accessible German Input Component
export const GermanAccessibleInput: React.FC<{
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  id?: string;
}> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  ariaLabel,
  ariaDescribedBy,
  id
}) => {
  const { isGerman, getAccessibilityAttributes, isHighContrast } = useGermanAccessibilityContext();
  
  const accessibilityAttrs = getAccessibilityAttributes('input');
  
  const inputStyles = {
    ...(isHighContrast && isGerman && {
      border: '2px solid #000000',
      backgroundColor: '#ffffff',
      color: '#000000'
    })
  };

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      id={id}
      className={`${className} ${isGerman ? 'german-accessible-input' : ''}`}
      style={inputStyles}
      aria-label={ariaLabel || (isGerman ? accessibilityAttrs['aria-label'] : undefined)}
      aria-describedby={ariaDescribedBy || (isGerman ? accessibilityAttrs['aria-describedby'] : undefined)}
      aria-required={required}
      aria-invalid={false}
      {...(isGerman && accessibilityAttrs)}
    />
  );
};

// Accessible German Navigation Component
export const GermanAccessibleNavigation: React.FC<{
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}> = ({ children, className = '', ariaLabel }) => {
  const { isGerman, getAccessibilityAttributes } = useGermanAccessibilityContext();
  
  const accessibilityAttrs = getAccessibilityAttributes('navigation');

  return (
    <nav
      id="navigation"
      className={`${className} ${isGerman ? 'german-accessible-nav' : ''}`}
      aria-label={ariaLabel || (isGerman ? accessibilityAttrs['aria-label'] : 'Navigation')}
      {...(isGerman && accessibilityAttrs)}
    >
      {children}
    </nav>
  );
};

// Accessible German Main Content Component
export const GermanAccessibleMain: React.FC<{
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}> = ({ children, className = '', ariaLabel }) => {
  const { isGerman, getAccessibilityAttributes } = useGermanAccessibilityContext();
  
  const accessibilityAttrs = getAccessibilityAttributes('main');

  return (
    <main
      id="main-content"
      className={`${className} ${isGerman ? 'german-accessible-main' : ''}`}
      aria-label={ariaLabel || (isGerman ? accessibilityAttrs['aria-label'] : 'Main content')}
      tabIndex={-1}
      {...(isGerman && accessibilityAttrs)}
    >
      {children}
    </main>
  );
};

// Accessible German Modal Component
export const GermanAccessibleModal: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
}> = ({ children, isOpen, onClose, title, className = '' }) => {
  const { isGerman, getAccessibilityAttributes, announceToScreenReader } = useGermanAccessibilityContext();
  
  const accessibilityAttrs = getAccessibilityAttributes('modal');

  useEffect(() => {
    if (isOpen && isGerman) {
      announceToScreenReader(`Dialog geöffnet: ${title}`, 'assertive');
      
      // Focus trap
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
        
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
        if (isGerman) {
          announceToScreenReader('Dialog geschlossen', 'polite');
        }
      };
    }
  }, [isOpen, isGerman, title, onClose, announceToScreenReader]);

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${className}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`modal-content ${isGerman ? 'german-accessible-modal' : ''}`}
        aria-label={isGerman ? `Dialog: ${title}` : `Modal: ${title}`}
        aria-labelledby="modal-title"
        {...(isGerman && accessibilityAttrs)}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <GermanAccessibleButton
            onClick={onClose}
            className="modal-close"
            ariaLabel={isGerman ? 'Dialog schließen' : 'Close modal'}
          >
            ×
          </GermanAccessibleButton>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};