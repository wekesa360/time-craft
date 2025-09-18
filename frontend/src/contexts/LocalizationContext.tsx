import React, { createContext, useContext, memo, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useCurrentLanguage } from '../hooks/queries/useLocalizationQueries';
import { usePreloadLocalization } from '../components/localization/LazyLocalizationComponents';

interface LocalizationContextType {
  currentLanguage: string;
  isLoading: boolean;
  error: Error | null;
  preloadComponents: () => void;
  isComponentsPreloaded: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: ReactNode;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = memo(({ 
  children 
}) => {
  const currentLanguage = useCurrentLanguage();
  const { preload } = usePreloadLocalization();
  const [isComponentsPreloaded, setIsComponentsPreloaded] = React.useState(false);

  const preloadComponents = useCallback(() => {
    if (!isComponentsPreloaded) {
      preload();
      setIsComponentsPreloaded(true);
    }
  }, [preload, isComponentsPreloaded]);

  const value: LocalizationContextType = useMemo(() => ({
    currentLanguage,
    isLoading: false,
    error: null,
    preloadComponents,
    isComponentsPreloaded,
  }), [currentLanguage, preloadComponents, isComponentsPreloaded]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
});

LocalizationProvider.displayName = 'LocalizationProvider';

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};