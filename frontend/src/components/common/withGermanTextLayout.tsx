import React, { type ComponentType, useEffect, useRef } from 'react';
import { useGermanTextLayout, isLikelyGermanCompound } from '../../hooks/useGermanTextLayout';

interface WithGermanTextLayoutOptions {
  enableCompoundWordDetection?: boolean;
  enableResponsiveLayout?: boolean;
  customClasses?: string;
  applyToChildren?: boolean;
}

export function withGermanTextLayout<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithGermanTextLayoutOptions = {}
) {
  const {
    enableCompoundWordDetection = true,
    enableResponsiveLayout = true,
    customClasses = '',
    applyToChildren = true
  } = options;

  const WithGermanTextLayoutComponent: React.FC<P> = (props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { getResponsiveGermanClasses, isGermanActive } = useGermanTextLayout({
      applyToBody: false,
      applyToElements: false,
      enableResponsive: enableResponsiveLayout
    });

    // Apply German text layout to the component and its children
    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const baseClasses = enableResponsiveLayout 
        ? getResponsiveGermanClasses(customClasses)
        : `${customClasses} ${isGermanActive ? 'lang-de text-german' : 'lang-en'}`;

      // Apply classes to container
      container.className = `german-text-container ${baseClasses}`;

      if (applyToChildren && isGermanActive) {
        // Apply to child elements
        const textElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, label, div');
        
        textElements.forEach((element: Element) => {
          const htmlElement = element as HTMLElement;
          htmlElement.classList.add('lang-de');
          htmlElement.setAttribute('lang', 'de');

          // Check for compound words if enabled
          if (enableCompoundWordDetection) {
            const text = htmlElement.textContent || '';
            if (isLikelyGermanCompound(text)) {
              htmlElement.classList.add('german-compound-word');
            }
          }
        });
      }

      // Cleanup function
      return () => {
        if (applyToChildren) {
          const textElements = container.querySelectorAll('.lang-de');
          textElements.forEach((element: Element) => {
            const htmlElement = element as HTMLElement;
            htmlElement.classList.remove('lang-de', 'german-compound-word');
            htmlElement.removeAttribute('lang');
          });
        }
      };
    }, [isGermanActive, getResponsiveGermanClasses, customClasses, enableCompoundWordDetection, applyToChildren]);

    return (
      <div ref={containerRef} className="german-text-container">
        <WrappedComponent {...props} />
      </div>
    );
  };

  WithGermanTextLayoutComponent.displayName = `withGermanTextLayout(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithGermanTextLayoutComponent;
}

// Predefined layout configurations
export const germanTextLayoutConfigs = {
  // For components with lots of text content
  textHeavy: {
    enableCompoundWordDetection: true,
    enableResponsiveLayout: true,
    customClasses: 'text-german',
    applyToChildren: true
  },
  
  // For navigation and UI elements
  navigation: {
    enableCompoundWordDetection: true,
    enableResponsiveLayout: true,
    customClasses: 'text-german-compact',
    applyToChildren: true
  },
  
  // For forms and inputs
  forms: {
    enableCompoundWordDetection: false,
    enableResponsiveLayout: true,
    customClasses: 'text-german',
    applyToChildren: true
  },
  
  // For mobile-optimized components
  mobile: {
    enableCompoundWordDetection: true,
    enableResponsiveLayout: true,
    customClasses: 'text-german-mobile',
    applyToChildren: true
  },
  
  // Minimal layout changes
  minimal: {
    enableCompoundWordDetection: false,
    enableResponsiveLayout: false,
    customClasses: '',
    applyToChildren: false
  }
};

// Convenience HOCs with predefined configurations
export const withGermanTextHeavy = <P extends object>(component: ComponentType<P>) =>
  withGermanTextLayout(component, germanTextLayoutConfigs.textHeavy);

export const withGermanNavigation = <P extends object>(component: ComponentType<P>) =>
  withGermanTextLayout(component, germanTextLayoutConfigs.navigation);

export const withGermanForms = <P extends object>(component: ComponentType<P>) =>
  withGermanTextLayout(component, germanTextLayoutConfigs.forms);

export const withGermanMobile = <P extends object>(component: ComponentType<P>) =>
  withGermanTextLayout(component, germanTextLayoutConfigs.mobile);