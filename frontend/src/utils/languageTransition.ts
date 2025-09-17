import { toast } from 'react-hot-toast';

export interface LanguageTransitionConfig {
  preserveFormData?: boolean;
  preserveScrollPosition?: boolean;
  showToast?: boolean;
  animationDuration?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class LanguageTransitionManager {
  private static instance: LanguageTransitionManager;
  private isTransitioning = false;
  private savedState: Map<string, any> = new Map();

  static getInstance(): LanguageTransitionManager {
    if (!LanguageTransitionManager.instance) {
      LanguageTransitionManager.instance = new LanguageTransitionManager();
    }
    return LanguageTransitionManager.instance;
  }

  async performTransition(
    newLanguage: string,
    transitionFn: () => Promise<void>,
    config: LanguageTransitionConfig = {}
  ): Promise<void> {
    if (this.isTransitioning) {
      throw new Error('Language transition already in progress');
    }

    const {
      preserveFormData = true,
      preserveScrollPosition = true,
      showToast = true,
      animationDuration = 300,
      onStart,
      onComplete,
      onError
    } = config;

    try {
      this.isTransitioning = true;
      onStart?.();

      // Save current state
      if (preserveFormData || preserveScrollPosition) {
        this.saveCurrentState(preserveFormData, preserveScrollPosition);
      }

      // Apply transition classes
      this.applyTransitionClasses();

      // Perform the language change
      await transitionFn();

      // Wait for DOM updates
      await this.waitForDOMUpdate(animationDuration);

      // Restore state
      if (preserveFormData || preserveScrollPosition) {
        this.restoreState(preserveFormData, preserveScrollPosition);
      }

      // Show success toast
      if (showToast) {
        const message = newLanguage === 'de' 
          ? 'Sprache erfolgreich geändert!' 
          : 'Language changed successfully!';
        toast.success(message);
      }

      onComplete?.();

    } catch (error) {
      const err = error as Error;
      onError?.(err);
      
      if (showToast) {
        toast.error('Failed to change language');
      }
      
      throw err;
    } finally {
      this.removeTransitionClasses();
      this.isTransitioning = false;
    }
  }

  private saveCurrentState(preserveFormData: boolean, preserveScrollPosition: boolean): void {
    const state: any = {};

    if (preserveScrollPosition) {
      state.scrollPosition = {
        x: window.scrollX,
        y: window.scrollY
      };
    }

    if (preserveFormData) {
      state.formData = this.extractFormData();
    }

    this.savedState.set('currentState', state);
  }

  private extractFormData(): Map<string, any> {
    const formData = new Map();
    const forms = document.querySelectorAll('form');

    forms.forEach((form, index) => {
      const formState: Record<string, any> = {};
      const elements = form.querySelectorAll('input, textarea, select');

      elements.forEach((element: any) => {
        const name = element.name || element.id;
        if (!name) return;

        switch (element.type) {
          case 'checkbox':
          case 'radio':
            formState[name] = element.checked;
            break;
          case 'file':
            // Skip file inputs for security
            break;
          default:
            formState[name] = element.value;
        }
      });

      if (Object.keys(formState).length > 0) {
        formData.set(`form-${index}`, formState);
      }
    });

    return formData;
  }

  private restoreState(preserveFormData: boolean, preserveScrollPosition: boolean): void {
    const state = this.savedState.get('currentState');
    if (!state) return;

    if (preserveScrollPosition && state.scrollPosition) {
      requestAnimationFrame(() => {
        window.scrollTo({
          left: state.scrollPosition.x,
          top: state.scrollPosition.y,
          behavior: 'smooth'
        });
      });
    }

    if (preserveFormData && state.formData) {
      setTimeout(() => {
        this.restoreFormData(state.formData);
      }, 100);
    }
  }

  private restoreFormData(formData: Map<string, any>): void {
    const forms = document.querySelectorAll('form');

    forms.forEach((form, index) => {
      const savedData = formData.get(`form-${index}`);
      if (!savedData) return;

      const elements = form.querySelectorAll('input, textarea, select');
      
      elements.forEach((element: any) => {
        const name = element.name || element.id;
        if (!name || savedData[name] === undefined) return;

        switch (element.type) {
          case 'checkbox':
          case 'radio':
            element.checked = savedData[name];
            break;
          case 'file':
            // Skip file inputs
            break;
          default:
            element.value = savedData[name];
        }

        // Trigger events to update React state
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  private applyTransitionClasses(): void {
    document.body.classList.add('language-transitioning');
    
    // Add data attributes for better CSS targeting
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, label, nav, .card');
    elements.forEach(element => {
      element.setAttribute('data-language-transition', 'true');
    });
  }

  private removeTransitionClasses(): void {
    document.body.classList.remove('language-transitioning');
    
    // Remove data attributes
    const elements = document.querySelectorAll('[data-language-transition]');
    elements.forEach(element => {
      element.removeAttribute('data-language-transition');
    });
  }

  private async waitForDOMUpdate(duration: number): Promise<void> {
    return new Promise(resolve => {
      // Wait for translations to load and DOM to update
      setTimeout(resolve, duration);
    });
  }

  isCurrentlyTransitioning(): boolean {
    return this.isTransitioning;
  }

  clearSavedState(): void {
    this.savedState.clear();
  }
}

// Export singleton instance
export const languageTransitionManager = LanguageTransitionManager.getInstance();

// Utility functions
export const performSmoothLanguageChange = async (
  newLanguage: string,
  transitionFn: () => Promise<void>,
  config?: LanguageTransitionConfig
) => {
  return languageTransitionManager.performTransition(newLanguage, transitionFn, config);
};

export const isLanguageTransitioning = () => {
  return languageTransitionManager.isCurrentlyTransitioning();
};