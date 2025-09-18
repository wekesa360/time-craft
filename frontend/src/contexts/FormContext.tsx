import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useFormState } from '../hooks/useFormState';
import type { FormState, FormActions } from '../hooks/useFormState';
import { errorTracking } from '../services/errorTracking';

interface FormContextValue<T extends Record<string, any> = any> {
  formState: FormState<T>;
  formActions: FormActions<T>;
  registerForm: (id: string, formState: FormState<T>, formActions: FormActions<T>) => void;
  unregisterForm: (id: string) => void;
  getForm: (id: string) => { formState: FormState<T>; formActions: FormActions<T> } | null;
  getAllForms: () => Record<string, { formState: FormState<T>; formActions: FormActions<T> }>;
  resetAllForms: () => void;
  validateAllForms: () => boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

export const useFormContext = <T extends Record<string, any> = any>(): FormContextValue<T> => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context as FormContextValue<T>;
};

interface FormProviderProps {
  children: React.ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const formsRef = useRef<Record<string, { formState: FormState<any>; formActions: FormActions<any> }>>({});

  const registerForm = useCallback((id: string, formState: FormState<any>, formActions: FormActions<any>) => {
    formsRef.current[id] = { formState, formActions };
  }, []);

  const unregisterForm = useCallback((id: string) => {
    delete formsRef.current[id];
  }, []);

  const getForm = useCallback((id: string) => {
    return formsRef.current[id] || null;
  }, []);

  const getAllForms = useCallback(() => {
    return { ...formsRef.current };
  }, []);

  const resetAllForms = useCallback(() => {
    Object.values(formsRef.current).forEach(({ formActions }) => {
      formActions.reset();
    });
  }, []);

  const validateAllForms = useCallback(() => {
    let allValid = true;
    Object.values(formsRef.current).forEach(({ formActions }) => {
      const isValid = formActions.validate();
      if (!isValid) allValid = false;
    });
    return allValid;
  }, []);

  const contextValue: FormContextValue = {
    formState: {} as FormState<any>,
    formActions: {} as FormActions<any>,
    registerForm,
    unregisterForm,
    getForm,
    getAllForms,
    resetAllForms,
    validateAllForms,
  };

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

// Hook for managing multiple forms
export const useMultiForm = () => {
  const context = useFormContext();

  const createForm = useCallback(<T extends Record<string, any>>(
    id: string,
    options: Parameters<typeof useFormState<T>>[0]
  ) => {
    const formState = useFormState(options);
    
    // Register form with context
    React.useEffect(() => {
      context.registerForm(id, formState, formState);
      return () => context.unregisterForm(id);
    }, [id, formState, context]);

    return formState;
  }, [context]);

  const getFormById = useCallback((id: string) => {
    return context.getForm(id);
  }, [context]);

  const resetForm = useCallback((id: string) => {
    const form = context.getForm(id);
    if (form) {
      form.formActions.reset();
    }
  }, [context]);

  const validateForm = useCallback((id: string) => {
    const form = context.getForm(id);
    if (form) {
      return form.formActions.validate();
    }
    return true;
  }, [context]);

  return {
    createForm,
    getFormById,
    resetForm,
    validateForm,
    resetAllForms: context.resetAllForms,
    validateAllForms: context.validateAllForms,
    getAllForms: context.getAllForms,
  };
};

// Higher-order component for form state management
export const withFormState = <P extends object>(
  Component: React.ComponentType<P>,
  formOptions: Parameters<typeof useFormState>[0]
) => {
  const WrappedComponent = (props: P) => {
    const formState = useFormState(formOptions);

    return <Component {...props} formState={formState} />;
  };

  WrappedComponent.displayName = `withFormState(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Form persistence utilities
export const useFormPersistence = <T extends Record<string, any>>(
  formId: string,
  formState: FormState<T>,
  formActions: FormActions<T>
) => {
  const storageKey = `form_${formId}`;

  // Save form state to localStorage
  const saveFormState = useCallback(() => {
    try {
      const stateToSave = {
        values: formState.values,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      errorTracking.captureError(error as Error, {
        category: 'form',
        operation: 'saveFormState',
        formId,
      });
    }
  }, [formState.values, storageKey]);

  // Load form state from localStorage
  const loadFormState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const isRecent = Date.now() - parsedState.timestamp < 24 * 60 * 60 * 1000; // 24 hours
        if (isRecent && parsedState.values) {
          formActions.setValues(parsedState.values);
        }
      }
    } catch (error) {
      errorTracking.captureError(error as Error, {
        category: 'form',
        operation: 'loadFormState',
        formId,
      });
    }
  }, [storageKey, formActions]);

  // Clear saved form state
  const clearFormState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      errorTracking.captureError(error as Error, {
        category: 'form',
        operation: 'clearFormState',
        formId,
      });
    }
  }, [storageKey]);

  // Auto-save form state
  React.useEffect(() => {
    if (formState.isDirty) {
      const timeoutId = setTimeout(saveFormState, 1000); // Debounce save
      return () => clearTimeout(timeoutId);
    }
  }, [formState.isDirty, saveFormState]);

  // Load form state on mount
  React.useEffect(() => {
    loadFormState();
  }, [loadFormState]);

  return {
    saveFormState,
    loadFormState,
    clearFormState,
  };
};

// Form validation utilities
export const formValidationUtils = {
  // Email validation
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? undefined : 'Please enter a valid email address';
  },

  // Password validation
  password: (value: string) => {
    if (value.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/\d/.test(value)) return 'Password must contain at least one number';
    return undefined;
  },

  // Required field validation
  required: (value: any) => {
    if (value === undefined || value === null || value === '') {
      return 'This field is required';
    }
    return undefined;
  },

  // Minimum length validation
  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return undefined;
  },

  // Maximum length validation
  maxLength: (max: number) => (value: string) => {
    if (value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return undefined;
  },

  // Number validation
  number: (value: any) => {
    if (isNaN(Number(value))) {
      return 'Must be a valid number';
    }
    return undefined;
  },

  // Minimum value validation
  min: (min: number) => (value: number) => {
    if (value < min) {
      return `Must be at least ${min}`;
    }
    return undefined;
  },

  // Maximum value validation
  max: (max: number) => (value: number) => {
    if (value > max) {
      return `Must be no more than ${max}`;
    }
    return undefined;
  },

  // URL validation
  url: (value: string) => {
    try {
      new URL(value);
      return undefined;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  // Phone number validation
  phone: (value: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/\s/g, '')) ? undefined : 'Please enter a valid phone number';
  },
};

export default FormProvider;
