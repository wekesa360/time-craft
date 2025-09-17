/**
 * Loading State Management Hook
 * Centralized loading state management with optimistic updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
}

export interface UseLoadingStateOptions {
  initialLoading?: boolean;
  minimumLoadingTime?: number; // Minimum time to show loading state (prevents flashing)
  timeout?: number; // Maximum time before considering it failed
}

export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const { 
    initialLoading = false, 
    minimumLoadingTime = 300,
    timeout = 30000 
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    progress: undefined
  });

  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minimumTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start loading
  const startLoading = useCallback((progress?: number) => {
    startTimeRef.current = Date.now();
    
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (minimumTimeoutRef.current) {
      clearTimeout(minimumTimeoutRef.current);
    }

    setState({
      isLoading: true,
      error: null,
      progress
    });

    // Set timeout for max loading time
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Request timed out. Please try again.'
        }));
      }, timeout);
    }
  }, [timeout]);

  // Stop loading with minimum time enforcement
  const stopLoading = useCallback((error?: string | null) => {
    const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : minimumLoadingTime;
    const remainingTime = Math.max(0, minimumLoadingTime - elapsed);

    const finishLoading = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error || null,
        progress: undefined
      }));

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    if (remainingTime > 0) {
      minimumTimeoutRef.current = setTimeout(finishLoading, remainingTime);
    } else {
      finishLoading();
    }
  }, [minimumLoadingTime]);

  // Update progress
  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }));
  }, []);

  // Set error
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
      progress: undefined
    }));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (minimumTimeoutRef.current) {
        clearTimeout(minimumTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
    updateProgress,
    setError,
    clearError
  };
};

// Hook for async operations with loading state
export const useAsyncOperation = <TData = any, TError = Error>(
  options: UseLoadingStateOptions = {}
) => {
  const loadingState = useLoadingState(options);
  const [data, setData] = useState<TData | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<TData>,
    onSuccess?: (data: TData) => void,
    onError?: (error: TError) => void
  ) => {
    try {
      loadingState.startLoading();
      const result = await operation();
      setData(result);
      loadingState.stopLoading();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      loadingState.setError(errorMessage);
      onError?.(error as TError);
      throw error;
    }
  }, [loadingState]);

  const reset = useCallback(() => {
    setData(null);
    loadingState.clearError();
  }, [loadingState]);

  return {
    ...loadingState,
    data,
    execute,
    reset
  };
};

// Hook for multiple loading states
export const useMultipleLoadingStates = <TKeys extends string>(
  keys: TKeys[],
  options: UseLoadingStateOptions = {}
) => {
  const [states, setStates] = useState<Record<TKeys, LoadingState>>(() => {
    const initialStates = {} as Record<TKeys, LoadingState>;
    keys.forEach(key => {
      initialStates[key] = {
        isLoading: options.initialLoading || false,
        error: null,
        progress: undefined
      };
    });
    return initialStates;
  });

  const updateState = useCallback((key: TKeys, update: Partial<LoadingState>) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...update }
    }));
  }, []);

  const startLoading = useCallback((key: TKeys, progress?: number) => {
    updateState(key, { isLoading: true, error: null, progress });
  }, [updateState]);

  const stopLoading = useCallback((key: TKeys, error?: string | null) => {
    updateState(key, { isLoading: false, error: error || null, progress: undefined });
  }, [updateState]);

  const updateProgress = useCallback((key: TKeys, progress: number) => {
    updateState(key, { progress: Math.min(100, Math.max(0, progress)) });
  }, [updateState]);

  const setError = useCallback((key: TKeys, error: string) => {
    updateState(key, { error, isLoading: false, progress: undefined });
  }, [updateState]);

  const clearError = useCallback((key: TKeys) => {
    updateState(key, { error: null });
  }, [updateState]);

  // Computed states
  const isAnyLoading = Object.values(states).some(state => state.isLoading);
  const hasAnyError = Object.values(states).some(state => state.error);
  const allErrors = Object.entries(states)
    .filter(([, state]) => state.error)
    .map(([key, state]) => ({ key, error: state.error }));

  return {
    states,
    isAnyLoading,
    hasAnyError,
    allErrors,
    startLoading,
    stopLoading,
    updateProgress,
    setError,
    clearError,
    getState: (key: TKeys) => states[key]
  };
};

// Hook for pagination loading
export const usePaginationLoading = (options: UseLoadingStateOptions = {}) => {
  const loadingState = useLoadingState(options);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const startLoadingMore = useCallback(() => {
    setIsLoadingMore(true);
  }, []);

  const stopLoadingMore = useCallback(() => {
    setIsLoadingMore(false);
  }, []);

  return {
    ...loadingState,
    isLoadingMore,
    startLoadingMore,
    stopLoadingMore,
    isLoading: loadingState.isLoading || isLoadingMore
  };
};

// Hook for form submission loading
export const useFormLoading = (options: UseLoadingStateOptions = {}) => {
  const loadingState = useLoadingState(options);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((field: string, error: string) => {
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setValidationErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const hasFieldErrors = Object.keys(validationErrors).length > 0;

  return {
    ...loadingState,
    validationErrors,
    hasFieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors
  };
};