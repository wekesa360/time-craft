import React, { type ReactNode, useMemo, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { isLikelyGermanCompound } from '../../hooks/useGermanTextLayout';

interface GermanTextProps {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  enableHyphenation?: boolean;
  enableCompoundWordBreaking?: boolean;
  responsive?: boolean;
  maxWidth?: string;
  style?: React.CSSProperties;
  // HTML attributes
  htmlFor?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  [key: string]: any; // Allow other HTML attributes
}

export const GermanText: React.FC<GermanTextProps> = ({
  children,
  className = '',
  as: Component = 'span',
  enableHyphenation = true,
  enableCompoundWordBreaking = true,
  responsive = true,
  maxWidth,
  style = {},
  ...htmlAttributes
}) => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  // Determine if the text content contains compound words
  const hasCompoundWords = useMemo(() => {
    if (!isGerman || !enableCompoundWordBreaking) return false;
    
    const textContent = typeof children === 'string' ? children : '';
    return isLikelyGermanCompound(textContent);
  }, [children, isGerman, enableCompoundWordBreaking]);

  // Build CSS classes
  const cssClasses = useMemo(() => {
    const classes = [className];
    
    if (isGerman) {
      classes.push('lang-de');
      
      if (enableHyphenation) {
        classes.push('text-german');
      }
      
      if (hasCompoundWords) {
        classes.push('german-compound-word');
      }
      
      if (responsive) {
        classes.push('sm:text-german-compact', 'md:text-german');
      }
    } else {
      classes.push('lang-en');
    }
    
    return classes.filter(Boolean).join(' ');
  }, [className, isGerman, enableHyphenation, hasCompoundWords, responsive]);

  // Build inline styles
  const inlineStyles = useMemo(() => {
    const styles = { ...style };
    
    if (maxWidth) {
      styles.maxWidth = maxWidth;
    }
    
    return styles;
  }, [style, maxWidth]);

  // Build props for the component
  const componentProps = {
    ...htmlAttributes,
    className: cssClasses,
    style: inlineStyles,
    lang: isGerman ? 'de' : 'en',
    ...(isGerman && { 'data-german-text': 'true' })
  };

  return React.createElement(Component, componentProps, children);
};

// Specialized components for common use cases
export const GermanHeading: React.FC<Omit<GermanTextProps, 'as'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }> = ({
  level = 1,
  children,
  ...props
}) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  return <GermanText as={Component} {...props}>{children}</GermanText>;
};

export const GermanParagraph: React.FC<Omit<GermanTextProps, 'as'>> = ({ children, ...props }) => {
  return <GermanText as="p" {...props}>{children}</GermanText>;
};

export const GermanLabel: React.FC<Omit<GermanTextProps, 'as'> & { htmlFor?: string }> = ({
  htmlFor,
  children,
  ...props
}) => {
  return <GermanText as="label" htmlFor={htmlFor} {...props}>{children}</GermanText>;
};

export const GermanButton: React.FC<Omit<GermanTextProps, 'as'> & {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}> = ({ onClick, type = 'button', disabled, children, ...props }) => {
  return (
    <GermanText
      as="button"
      onClick={onClick}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </GermanText>
  );
};

// Hook for getting German text classes
export const useGermanTextClasses = (baseClasses: string = '') => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';
  
  return useMemo(() => {
    const classes = [baseClasses];
    
    if (isGerman) {
      classes.push('lang-de', 'text-german');
    } else {
      classes.push('lang-en');
    }
    
    return classes.filter(Boolean).join(' ');
  }, [baseClasses, isGerman]);
};

// Utility function to wrap text with German layout support
export const wrapWithGermanLayout = (
  text: string,
  options: {
    enableHyphenation?: boolean;
    enableCompoundWordBreaking?: boolean;
    className?: string;
  } = {}
) => {
  const { enableHyphenation = true, enableCompoundWordBreaking = true, className = '' } = options;
  
  return (
    <GermanText
      className={className}
      enableHyphenation={enableHyphenation}
      enableCompoundWordBreaking={enableCompoundWordBreaking}
    >
      {text}
    </GermanText>
  );
};