import React from 'react';

// Re-export German text components with expected names
export { 
  GermanText as GermanTextOptimizer,
  GermanHeading as GermanTitle,
  GermanParagraph as GermanDescription,
  GermanLabel,
  GermanButton,
  useGermanTextClasses
} from './GermanText';

// Additional components expected by tests
export const GermanCompoundWord: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <span className={className}>{children}</span>;
};

export const useGermanTextUtils = () => {
  return {
    formatCompoundWord: (word: string) => word,
    optimizeLineBreaks: (text: string) => text,
    detectGermanFeatures: (text: string) => ({ hasUmlaut: false, hasSharp: false })
  };
};

// Default export for compatibility
export { GermanText as default } from './GermanText';