import React, { ComponentType, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface WithLanguageTransitionOptions {
  preserveState?: boolean;
  animationClass?: string;
  transitionDuration?: number;
}

export function withLanguageTransition<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithLanguageTransitionOptions = {}
) {
  const {
    preserveState = true,
    animationClass = 'language-transition-fade',
    transitionDuration = 300
  } = options;

  const WithLanguageTransitionComponent: React.FC<P> = (props) => {
    const { i18n } = useTranslation();
    const previousLanguageRef = useRef(i18n.language);
    const componentRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef<any>(null);

    useEffect(() => {
      const currentLanguage = i18n.language;
      
      if (previousLanguageRef.current !== currentLanguage) {
        // Language has changed, apply transition
        const element = componentRef.current;
        if (element) {
          // Add transition class
          element.classList.add(animationClass);
          
          // Remove transition class after animation
          setTimeout(() => {
            element.classList.remove(animationClass);
          }, transitionDuration);
        }
        
        previousLanguageRef.current = currentLanguage;
      }
    }, [i18n.language]);

    return (
      <div 
        ref={componentRef}
        className="language-transition-wrapper"
        style={{
          transition: `opacity ${transitionDuration}ms ease-in-out, transform ${transitionDuration}ms ease-in-out`
        }}
      >
        <WrappedComponent {...props} />
      </div>
    );
  };

  WithLanguageTransitionComponent.displayName = `withLanguageTransition(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithLanguageTransitionComponent;
}

// Predefined animation classes
export const languageTransitionClasses = {
  fade: 'language-transition-fade',
  slideUp: 'language-transition-slide-up',
  slideLeft: 'language-transition-slide-left',
  scale: 'language-transition-scale'
};

// CSS-in-JS styles for the animations (to be added to global CSS)
export const languageTransitionStyles = `
.language-transition-fade {
  animation: languageFadeTransition 0.3s ease-in-out;
}

@keyframes languageFadeTransition {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.language-transition-slide-up {
  animation: languageSlideUpTransition 0.3s ease-in-out;
}

@keyframes languageSlideUpTransition {
  0% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(-5px); opacity: 0.7; }
  100% { transform: translateY(0); opacity: 1; }
}

.language-transition-slide-left {
  animation: languageSlideLeftTransition 0.3s ease-in-out;
}

@keyframes languageSlideLeftTransition {
  0% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(-10px); opacity: 0.7; }
  100% { transform: translateX(0); opacity: 1; }
}

.language-transition-scale {
  animation: languageScaleTransition 0.3s ease-in-out;
}

@keyframes languageScaleTransition {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.98); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
`;