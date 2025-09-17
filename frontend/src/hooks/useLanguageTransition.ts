import { useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface FormState {
  [key: string]: any;
}

interface TransitionOptions {
  preserveFormData?: boolean;
  preserveScrollPosition?: boolean;
  animationDuration?: number;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}

export const useLanguageTransition = (options: TransitionOptions = {}) => {
  const {
    preserveFormData = true,
    preserveScrollPosition = true,
    animationDuration = 300,
    onTransitionStart,
    onTransitionEnd
  } = options;

  const { i18n } = useTranslation();
  const formStateRef = useRef<Map<string, FormState>>(new Map());
  const scrollPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isTransitioningRef = useRef(false);

  // Save current page state
  const savePageState = useCallback(() => {
    if (!preserveFormData && !preserveScrollPosition) return;

    // Save scroll position
    if (preserveScrollPosition) {
      scrollPositionRef.current = {
        x: window.scrollX,
        y: window.scrollY
      };
    }

    // Save form data
    if (preserveFormData) {
      const forms = document.querySelectorAll('form');
      const formStates = new Map<string, FormState>();

      forms.forEach((form, index) => {
        const formData: FormState = {};
        const formElements = form.querySelectorAll('input, textarea, select');

        formElements.forEach((element: any) => {
          const name = element.name || element.id;
          if (!name) return;

          switch (element.type) {
            case 'checkbox':
            case 'radio':
              formData[name] = element.checked;
              break;
            case 'file':
              // Don't preserve file inputs for security reasons
              break;
            default:
              formData[name] = element.value;
          }
        });

        if (Object.keys(formData).length > 0) {
          formStates.set(`form-${index}`, formData);
        }
      });

      formStateRef.current = formStates;
    }
  }, [preserveFormData, preserveScrollPosition]);

  // Restore page state
  const restorePageState = useCallback(() => {
    if (!preserveFormData && !preserveScrollPosition) return;

    // Restore scroll position
    if (preserveScrollPosition) {
      const { x, y } = scrollPositionRef.current;
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          left: x,
          top: y,
          behavior: 'smooth'
        });
      });
    }

    // Restore form data
    if (preserveFormData) {
      setTimeout(() => {
        const forms = document.querySelectorAll('form');
        
        forms.forEach((form, index) => {
          const savedState = formStateRef.current.get(`form-${index}`);
          if (!savedState) return;

          const formElements = form.querySelectorAll('input, textarea, select');
          
          formElements.forEach((element: any) => {
            const name = element.name || element.id;
            if (!name || savedState[name] === undefined) return;

            switch (element.type) {
              case 'checkbox':
              case 'radio':
                element.checked = savedState[name];
                break;
              case 'file':
                // Skip file inputs
                break;
              default:
                element.value = savedState[name];
            }

            // Dispatch input event to trigger React state updates
            const event = new Event('input', { bubbles: true });
            element.dispatchEvent(event);

            // Also dispatch change event for some components
            const changeEvent = new Event('change', { bubbles: true });
            element.dispatchEvent(changeEvent);
          });
        });
      }, 100);
    }
  }, [preserveFormData, preserveScrollPosition]);

  // Apply transition classes
  const applyTransitionClasses = useCallback(() => {
    document.body.classList.add('language-transitioning');
    
    // Add data attributes to translatable elements for better targeting
    const translatableElements = document.querySelectorAll('[data-testid], h1, h2, h3, h4, h5, h6, p, span, button, label');
    translatableElements.forEach(element => {
      element.setAttribute('data-translate', 'true');
    });
  }, []);

  // Remove transition classes
  const removeTransitionClasses = useCallback(() => {
    document.body.classList.remove('language-transitioning');
    
    // Remove data attributes
    const translatableElements = document.querySelectorAll('[data-translate]');
    translatableElements.forEach(element => {
      element.removeAttribute('data-translate');
    });
  }, []);

  // Main transition function
  const performLanguageTransition = useCallback(async (
    newLanguage: string,
    transitionFn: () => Promise<void>
  ) => {
    if (isTransitioningRef.current) return;
    
    try {
      isTransitioningRef.current = true;
      onTransitionStart?.();

      // Save current state
      savePageState();

      // Apply transition classes
      applyTransitionClasses();

      // Perform the language change
      await transitionFn();

      // Wait for translations to load and DOM to update
      await new Promise(resolve => setTimeout(resolve, animationDuration));

      // Restore state
      restorePageState();

      // Remove transition classes
      setTimeout(() => {
        removeTransitionClasses();
        onTransitionEnd?.();
        isTransitioningRef.current = false;
      }, 100);

    } catch (error) {
      console.error('Language transition error:', error);
      removeTransitionClasses();
      isTransitioningRef.current = false;
      throw error;
    }
  }, [
    savePageState,
    restorePageState,
    applyTransitionClasses,
    removeTransitionClasses,
    animationDuration,
    onTransitionStart,
    onTransitionEnd
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTransitioningRef.current) {
        removeTransitionClasses();
      }
    };
  }, [removeTransitionClasses]);

  return {
    performLanguageTransition,
    isTransitioning: isTransitioningRef.current,
    savePageState,
    restorePageState
  };
};