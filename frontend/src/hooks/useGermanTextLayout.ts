import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface GermanTextLayoutOptions {
  applyToBody?: boolean;
  applyToElements?: boolean;
  customSelector?: string;
  enableResponsive?: boolean;
}

export const useGermanTextLayout = (options: GermanTextLayoutOptions = {}) => {
  const {
    applyToBody = true,
    applyToElements = true,
    customSelector,
    enableResponsive = true
  } = options;

  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  // Apply German text layout classes
  const applyGermanLayout = useCallback(() => {
    const isGerman = currentLanguage === 'de';
    
    if (applyToBody) {
      // Apply language attribute to document
      document.documentElement.lang = currentLanguage;
      
      // Apply German class to body
      if (isGerman) {
        document.body.classList.add('lang-de');
        document.body.classList.remove('lang-en');
      } else {
        document.body.classList.add('lang-en');
        document.body.classList.remove('lang-de');
      }
    }

    if (applyToElements) {
      // Apply to common text elements
      const selectors = [
        'h1, h2, h3, h4, h5, h6',
        'p',
        'span',
        'div',
        'button',
        'label',
        '.card-title',
        '.nav-item',
        '.form-label',
        '.btn',
        '.alert',
        '.modal-title',
        '.modal-body',
        '.dropdown-item',
        '.breadcrumb-item',
        '.tab',
        '.badge',
        '.tag',
        '.list-item'
      ];

      if (customSelector) {
        selectors.push(customSelector);
      }

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (isGerman) {
            element.classList.add('lang-de');
            element.classList.remove('lang-en');
            element.setAttribute('lang', 'de');
          } else {
            element.classList.add('lang-en');
            element.classList.remove('lang-de');
            element.setAttribute('lang', 'en');
          }
        });
      });
    }

    // Apply responsive classes if enabled
    if (enableResponsive && isGerman) {
      const mediaQuery = window.matchMedia('(max-width: 640px)');
      const applyMobileClasses = (matches: boolean) => {
        const elements = document.querySelectorAll('.lang-de');
        elements.forEach(element => {
          if (matches) {
            element.classList.add('text-german-mobile');
          } else {
            element.classList.remove('text-german-mobile');
          }
        });
      };

      applyMobileClasses(mediaQuery.matches);
      mediaQuery.addEventListener('change', (e) => applyMobileClasses(e.matches));
    }
  }, [currentLanguage, applyToBody, applyToElements, customSelector, enableResponsive]);

  // Remove German layout classes
  const removeGermanLayout = useCallback(() => {
    if (applyToBody) {
      document.body.classList.remove('lang-de', 'lang-en');
    }

    if (applyToElements) {
      const elements = document.querySelectorAll('.lang-de, .lang-en');
      elements.forEach(element => {
        element.classList.remove('lang-de', 'lang-en', 'text-german-mobile');
        element.removeAttribute('lang');
      });
    }
  }, [applyToBody, applyToElements]);

  // Apply layout on language change
  useEffect(() => {
    applyGermanLayout();
    
    // Cleanup on unmount
    return () => {
      removeGermanLayout();
    };
  }, [applyGermanLayout, removeGermanLayout]);

  // Utility functions
  const getGermanTextClasses = useCallback((baseClasses: string = '') => {
    const isGerman = currentLanguage === 'de';
    const germanClasses = isGerman ? 'lang-de text-german' : 'lang-en';
    return `${baseClasses} ${germanClasses}`.trim();
  }, [currentLanguage]);

  const getResponsiveGermanClasses = useCallback((baseClasses: string = '') => {
    const isGerman = currentLanguage === 'de';
    const germanClasses = isGerman 
      ? 'lang-de text-german sm:text-german-compact md:text-german' 
      : 'lang-en';
    return `${baseClasses} ${germanClasses}`.trim();
  }, [currentLanguage]);

  const isGermanActive = currentLanguage === 'de';

  return {
    applyGermanLayout,
    removeGermanLayout,
    getGermanTextClasses,
    getResponsiveGermanClasses,
    isGermanActive,
    currentLanguage
  };
};

// Utility function to check if text might be a German compound word
export const isLikelyGermanCompound = (text: string): boolean => {
  if (!text || text.length < 10) return false;
  
  // Common German compound word patterns
  const compoundPatterns = [
    /[a-z]+[A-Z][a-z]+/, // camelCase compounds
    /[a-z]+(ung|keit|heit|schaft|tum)$/, // common German suffixes
    /^(Haupt|Neben|Unter|Über|Vor|Nach|Mit|Gegen)[A-Z]/, // common prefixes
    /[a-z]+(stelle|platz|haus|werk|zeug|mittel)$/, // common compound endings
  ];
  
  return compoundPatterns.some(pattern => pattern.test(text));
};

// Utility function to add compound word handling to an element
export const addCompoundWordHandling = (element: HTMLElement, text: string) => {
  if (isLikelyGermanCompound(text)) {
    element.classList.add('german-compound-word');
  }
};