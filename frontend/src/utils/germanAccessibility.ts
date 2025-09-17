/**
 * German Accessibility Utilities
 * Provides accessibility enhancements specifically for German language content
 */

export interface GermanAccessibilityConfig {
  enableScreenReaderSupport?: boolean;
  enableKeyboardNavigation?: boolean;
  enableHighContrastMode?: boolean;
  announceLanguageChanges?: boolean;
  enableAriaLabels?: boolean;
}

export class GermanAccessibilityManager {
  private static instance: GermanAccessibilityManager;
  private config: GermanAccessibilityConfig;
  private currentLanguage: string = 'en';

  constructor(config: GermanAccessibilityConfig = {}) {
    this.config = {
      enableScreenReaderSupport: true,
      enableKeyboardNavigation: true,
      enableHighContrastMode: true,
      announceLanguageChanges: true,
      enableAriaLabels: true,
      ...config
    };
  }

  static getInstance(config?: GermanAccessibilityConfig): GermanAccessibilityManager {
    if (!GermanAccessibilityManager.instance) {
      GermanAccessibilityManager.instance = new GermanAccessibilityManager(config);
    }
    return GermanAccessibilityManager.instance;
  }

  /**
   * Initialize German accessibility features
   */
  initialize(language: string = 'en'): void {
    this.currentLanguage = language;
    
    if (this.config.enableScreenReaderSupport) {
      this.setupScreenReaderSupport();
    }
    
    if (this.config.enableKeyboardNavigation) {
      this.enhanceKeyboardNavigation();
    }
    
    if (this.config.enableHighContrastMode) {
      this.setupHighContrastMode();
    }
    
    if (this.config.enableAriaLabels) {
      this.updateAriaLabels();
    }
  }

  /**
   * Setup screen reader support for German content
   */
  private setupScreenReaderSupport(): void {
    // Set document language
    document.documentElement.lang = this.currentLanguage;
    
    // Add screen reader specific styles
    const style = document.createElement('style');
    style.id = 'german-screen-reader-styles';
    style.textContent = `
      /* Screen reader only content */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      /* Screen reader only content that becomes visible on focus */
      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        padding: inherit;
        margin: inherit;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }
      
      /* German-specific screen reader enhancements */
      [lang="de"] .compound-word::before {
        content: "";
        speak: literal;
      }
      
      /* Announce language changes */
      .language-announcement {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
    `;
    
    // Remove existing styles if present
    const existingStyle = document.getElementById('german-screen-reader-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
  }

  /**
   * Enhance keyboard navigation for German interface
   */
  private enhanceKeyboardNavigation(): void {
    // Add keyboard navigation enhancements
    const style = document.createElement('style');
    style.id = 'german-keyboard-navigation';
    style.textContent = `
      /* Enhanced focus indicators for German text */
      [lang="de"] *:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-radius: 2px;
      }
      
      /* Skip links for German interface */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
      }
      
      .skip-link:focus {
        top: 6px;
      }
      
      /* German button focus states */
      [lang="de"] button:focus,
      [lang="de"] .btn:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }
      
      /* German form focus states */
      [lang="de"] input:focus,
      [lang="de"] textarea:focus,
      [lang="de"] select:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-color: #3b82f6;
      }
      
      /* German navigation focus states */
      [lang="de"] .nav-item:focus,
      [lang="de"] .nav-link:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        background-color: rgba(59, 130, 246, 0.1);
      }
    `;
    
    // Remove existing styles if present
    const existingStyle = document.getElementById('german-keyboard-navigation');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);

    // Add skip links for German interface
    this.addSkipLinks();
  }

  /**
   * Add skip navigation links for German interface
   */
  private addSkipLinks(): void {
    if (this.currentLanguage !== 'de') return;

    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.id = 'german-skip-links';
    skipLinksContainer.innerHTML = `
      <a href="#main-content" class="skip-link">Zum Hauptinhalt springen</a>
      <a href="#navigation" class="skip-link">Zur Navigation springen</a>
      <a href="#footer" class="skip-link">Zum Footer springen</a>
    `;

    // Remove existing skip links
    const existing = document.getElementById('german-skip-links');
    if (existing) {
      existing.remove();
    }

    // Insert at the beginning of body
    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  /**
   * Setup high contrast mode support for German text
   */
  private setupHighContrastMode(): void {
    const style = document.createElement('style');
    style.id = 'german-high-contrast';
    style.textContent = `
      /* High contrast mode for German text */
      @media (prefers-contrast: high) {
        [lang="de"] {
          color: #000000;
          background-color: #ffffff;
        }
        
        [lang="de"] .btn {
          border: 2px solid #000000;
          background-color: #ffffff;
          color: #000000;
        }
        
        [lang="de"] .btn:hover,
        [lang="de"] .btn:focus {
          background-color: #000000;
          color: #ffffff;
        }
        
        [lang="de"] input,
        [lang="de"] textarea,
        [lang="de"] select {
          border: 2px solid #000000;
          background-color: #ffffff;
          color: #000000;
        }
        
        [lang="de"] .card {
          border: 2px solid #000000;
          background-color: #ffffff;
        }
        
        [lang="de"] .nav-item {
          border: 1px solid #000000;
        }
        
        [lang="de"] .nav-item:hover,
        [lang="de"] .nav-item:focus {
          background-color: #000000;
          color: #ffffff;
        }
        
        /* Enhanced contrast for German compound words */
        [lang="de"] .compound-word {
          font-weight: bold;
          text-decoration: underline;
        }
        
        /* High contrast focus indicators */
        [lang="de"] *:focus {
          outline: 3px solid #000000;
          outline-offset: 2px;
          background-color: #ffff00;
          color: #000000;
        }
      }
      
      /* Forced colors mode support */
      @media (forced-colors: active) {
        [lang="de"] {
          forced-color-adjust: none;
        }
        
        [lang="de"] .btn {
          border: 1px solid ButtonText;
          background-color: ButtonFace;
          color: ButtonText;
        }
        
        [lang="de"] .btn:hover,
        [lang="de"] .btn:focus {
          border: 1px solid Highlight;
          background-color: Highlight;
          color: HighlightText;
        }
      }
    `;
    
    // Remove existing styles if present
    const existingStyle = document.getElementById('german-high-contrast');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
  }

  /**
   * Update ARIA labels for German content
   */
  private updateAriaLabels(): void {
    if (this.currentLanguage !== 'de') return;

    // German ARIA labels mapping
    const germanAriaLabels = {
      'Close': 'Schließen',
      'Open': 'Öffnen',
      'Menu': 'Menü',
      'Search': 'Suchen',
      'Submit': 'Absenden',
      'Cancel': 'Abbrechen',
      'Save': 'Speichern',
      'Delete': 'Löschen',
      'Edit': 'Bearbeiten',
      'Add': 'Hinzufügen',
      'Remove': 'Entfernen',
      'Previous': 'Vorherige',
      'Next': 'Nächste',
      'First': 'Erste',
      'Last': 'Letzte',
      'Loading': 'Wird geladen',
      'Error': 'Fehler',
      'Success': 'Erfolgreich',
      'Warning': 'Warnung',
      'Information': 'Information',
      'Required': 'Erforderlich',
      'Optional': 'Optional',
      'Invalid': 'Ungültig',
      'Valid': 'Gültig'
    };

    // Update existing ARIA labels
    Object.entries(germanAriaLabels).forEach(([english, german]) => {
      const elements = document.querySelectorAll(`[aria-label="${english}"]`);
      elements.forEach(element => {
        element.setAttribute('aria-label', german);
      });
    });

    // Add German-specific ARIA descriptions
    this.addGermanAriaDescriptions();
  }

  /**
   * Add German-specific ARIA descriptions
   */
  private addGermanAriaDescriptions(): void {
    // Add descriptions for compound words
    const compoundWords = document.querySelectorAll('.compound-word, .german-compound-word');
    compoundWords.forEach(element => {
      if (!element.getAttribute('aria-describedby')) {
        const description = 'Zusammengesetztes deutsches Wort mit automatischer Silbentrennung';
        const descId = `compound-desc-${Math.random().toString(36).substr(2, 9)}`;
        
        const descElement = document.createElement('span');
        descElement.id = descId;
        descElement.className = 'sr-only';
        descElement.textContent = description;
        
        element.setAttribute('aria-describedby', descId);
        element.appendChild(descElement);
      }
    });

    // Add descriptions for language switcher
    const languageSwitchers = document.querySelectorAll('[data-testid="language-selector"]');
    languageSwitchers.forEach(element => {
      element.setAttribute('aria-label', 'Sprache wechseln');
      element.setAttribute('aria-describedby', 'language-switcher-desc');
    });

    // Create language switcher description
    if (!document.getElementById('language-switcher-desc')) {
      const descElement = document.createElement('span');
      descElement.id = 'language-switcher-desc';
      descElement.className = 'sr-only';
      descElement.textContent = 'Wählen Sie eine Sprache aus, um die Benutzeroberfläche zu ändern';
      document.body.appendChild(descElement);
    }
  }

  /**
   * Announce language change to screen readers
   */
  announceLanguageChange(newLanguage: string, languageName: string): void {
    if (!this.config.announceLanguageChanges) return;

    const announcement = document.createElement('div');
    announcement.className = 'language-announcement';
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    
    const message = newLanguage === 'de' 
      ? `Sprache wurde zu ${languageName} geändert`
      : `Language changed to ${languageName}`;
    
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove announcement after screen reader has time to read it
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 3000);
  }

  /**
   * Update language and refresh accessibility features
   */
  updateLanguage(newLanguage: string): void {
    const oldLanguage = this.currentLanguage;
    this.currentLanguage = newLanguage;
    
    // Update document language
    document.documentElement.lang = newLanguage;
    
    // Refresh accessibility features
    this.initialize(newLanguage);
    
    // Announce language change
    const languageNames = {
      'en': 'English',
      'de': 'Deutsch'
    };
    
    this.announceLanguageChange(newLanguage, languageNames[newLanguage as keyof typeof languageNames] || newLanguage);
  }

  /**
   * Check if current environment supports accessibility features
   */
  checkAccessibilitySupport(): {
    screenReader: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    forcedColors: boolean;
  } {
    return {
      screenReader: 'speechSynthesis' in window,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      forcedColors: window.matchMedia('(forced-colors: active)').matches
    };
  }

  /**
   * Get German accessibility status
   */
  getAccessibilityStatus(): {
    isGerman: boolean;
    hasScreenReaderSupport: boolean;
    hasKeyboardNavigation: boolean;
    hasHighContrastMode: boolean;
    hasAriaLabels: boolean;
    environmentSupport: ReturnType<typeof this.checkAccessibilitySupport>;
  } {
    return {
      isGerman: this.currentLanguage === 'de',
      hasScreenReaderSupport: this.config.enableScreenReaderSupport || false,
      hasKeyboardNavigation: this.config.enableKeyboardNavigation || false,
      hasHighContrastMode: this.config.enableHighContrastMode || false,
      hasAriaLabels: this.config.enableAriaLabels || false,
      environmentSupport: this.checkAccessibilitySupport()
    };
  }

  /**
   * Cleanup accessibility features
   */
  cleanup(): void {
    // Remove added styles
    const stylesToRemove = [
      'german-screen-reader-styles',
      'german-keyboard-navigation',
      'german-high-contrast'
    ];
    
    stylesToRemove.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });

    // Remove skip links
    const skipLinks = document.getElementById('german-skip-links');
    if (skipLinks) {
      skipLinks.remove();
    }

    // Remove language announcements
    const announcements = document.querySelectorAll('.language-announcement');
    announcements.forEach(announcement => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GermanAccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initialize(this.currentLanguage);
  }
}

// Export singleton instance
export const germanAccessibility = GermanAccessibilityManager.getInstance();

// Utility functions
export const initializeGermanAccessibility = (language: string = 'en', config?: GermanAccessibilityConfig) => {
  const manager = GermanAccessibilityManager.getInstance(config);
  manager.initialize(language);
  return manager;
};

export const announceLanguageChange = (newLanguage: string, languageName: string) => {
  germanAccessibility.announceLanguageChange(newLanguage, languageName);
};

export const updateGermanAccessibilityLanguage = (newLanguage: string) => {
  germanAccessibility.updateLanguage(newLanguage);
};

export const getGermanAccessibilityStatus = () => {
  return germanAccessibility.getAccessibilityStatus();
};