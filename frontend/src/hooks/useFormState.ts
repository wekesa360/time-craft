import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';

export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  submitCount: number;
}

export interface FormActions<T extends Record<string, any>> {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  reset: (values?: Partial<T>) => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => void;
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K];
    onChange: (value: T[K]) => void;
    onBlur: () => void;
    error?: string;
    touched: boolean;
    dirty: boolean;
  };
}

export interface UseFormStateOptions<T extends Record<string, any>> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnMount?: boolean;
  onSubmit?: (values: T) => void | Promise<void>;
  onError?: (errors: Partial<Record<keyof T, string>>) => void;
  transform?: {
    input?: (values: T) => T;
    output?: (values: T) => T;
  };
}

export function useFormState<T extends Record<string, any>>(
  options: UseFormStateOptions<T>
): FormState<T> & FormActions<T> {
  const {
    initialValues,
    validationSchema,
    validateOnChange = true,
    validateOnBlur = true,
    validateOnMount = false,
    onSubmit,
    onError,
    transform,
  } = options;

  const [state, setState] = useState<FormState<T>>(() => ({
    values: { ...initialValues },
    errors: {},
    touched: {},
    dirty: {},
    isValid: true,
    isSubmitting: false,
    isDirty: false,
    submitCount: 0,
  }));

  const validationSchemaRef = useRef(validationSchema);
  const initialValuesRef = useRef(initialValues);

  // Update refs when props change
  useEffect(() => {
    validationSchemaRef.current = validationSchema;
  }, [validationSchema]);

  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  // Validate form
  const validate = useCallback((): boolean => {
    if (!validationSchemaRef.current) {
      setState(prev => ({ ...prev, isValid: true, errors: {} }));
      return true;
    }

    try {
      const transformedValues = transform?.input ? transform.input(state.values) : state.values;
      validationSchemaRef.current.parse(transformedValues);
      setState(prev => ({ ...prev, isValid: true, errors: {} }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof T, string>> = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.') as keyof T;
          errors[path] = err.message;
        });
        setState(prev => ({ ...prev, isValid: false, errors }));
        onError?.(errors);
        return false;
      }
      return false;
    }
  }, [state.values, transform, onError]);

  // Validate single field
  const validateField = useCallback((field: keyof T): boolean => {
    if (!validationSchemaRef.current) return true;

    try {
      const fieldSchema = (validationSchemaRef.current as any).shape?.[field as string];
      if (!fieldSchema) return true;

      fieldSchema.parse(state.values[field]);
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: undefined },
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues[0]?.message || 'Invalid value';
        setState(prev => ({
          ...prev,
          errors: { ...prev.errors, [field]: errorMessage },
        }));
        return false;
      }
      return false;
    }
  }, [state.values]);

  // Set value for a field
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const newDirty = { ...prev.dirty, [field]: value !== initialValuesRef.current[field] };
      const isDirty = Object.values(newDirty).some(Boolean);

      return {
        ...prev,
        values: newValues,
        dirty: newDirty,
        isDirty,
      };
    });

    if (validateOnChange) {
      validateField(field);
    }
  }, [validateOnChange, validateField]);

  // Set error for a field
  const setError = useCallback((field: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
      isValid: false,
    }));
  }, []);

  // Set touched state for a field
  const setTouched = useCallback((field: keyof T, touched = true) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: touched },
    }));

    if (validateOnBlur && touched) {
      validateField(field);
    }
  }, [validateOnBlur, validateField]);

  // Set multiple values
  const setValues = useCallback((values: Partial<T>) => {
    setState(prev => {
      const newValues = { ...prev.values, ...values };
      const newDirty: Partial<Record<keyof T, boolean>> = {};
      let isDirty = false;

      Object.keys(values).forEach((key) => {
        const field = key as keyof T;
        newDirty[field] = values[field] !== initialValuesRef.current[field];
        if (newDirty[field]) isDirty = true;
      });

      return {
        ...prev,
        values: newValues,
        dirty: { ...prev.dirty, ...newDirty },
        isDirty: prev.isDirty || isDirty,
      };
    });
  }, []);

  // Set multiple errors
  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...errors },
      isValid: Object.keys(errors).length === 0,
    }));
  }, []);

  // Reset form
  const reset = useCallback((values?: Partial<T>) => {
    const resetValues = values ? { ...initialValuesRef.current, ...values } : initialValuesRef.current;
    setState({
      values: resetValues,
      errors: {},
      touched: {},
      dirty: {},
      isValid: true,
      isSubmitting: false,
      isDirty: false,
      submitCount: 0,
    });
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((onSubmitHandler: (values: T) => void | Promise<void>) => {
    return async (e?: React.FormEvent) => {
      e?.preventDefault();

      setState(prev => ({ ...prev, isSubmitting: true, submitCount: prev.submitCount + 1 }));

      // Mark all fields as touched
      const allTouched: Partial<Record<keyof T, boolean>> = {};
      Object.keys(state.values).forEach((key) => {
        allTouched[key as keyof T] = true;
      });
      setState(prev => ({ ...prev, touched: { ...prev.touched, ...allTouched } }));

      // Validate form
      const isValid = validate();
      if (!isValid) {
        setState(prev => ({ ...prev, isSubmitting: false }));
        return;
      }

      try {
        const valuesToSubmit = transform?.output ? transform.output(state.values) : state.values;
        await onSubmitHandler(valuesToSubmit);
      } catch (error) {
        console.error('Form submission error:', error);
        // Handle submission error
      } finally {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    };
  }, [state.values, validate, transform]);

  // Get field props for easy integration with form inputs
  const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
    return {
      value: state.values[field],
      onChange: (value: T[K]) => setValue(field, value),
      onBlur: () => setTouched(field),
      error: state.errors[field],
      touched: state.touched[field] || false,
      dirty: state.dirty[field] || false,
    };
  }, [state.values, state.errors, state.touched, state.dirty, setValue, setTouched]);

  // Validate on mount
  useEffect(() => {
    if (validateOnMount) {
      validate();
    }
  }, [validateOnMount, validate]);

  // Auto-submit if onSubmit is provided
  useEffect(() => {
    if (onSubmit && state.isValid && state.isDirty) {
      const timeoutId = setTimeout(() => {
        handleSubmit(onSubmit)();
      }, 1000); // Debounce auto-submit

      return () => clearTimeout(timeoutId);
    }
  }, [onSubmit, state.isValid, state.isDirty, handleSubmit]);

  return {
    ...state,
    setValue,
    setError,
    setTouched,
    setValues,
    setErrors,
    reset,
    validate,
    validateField,
    handleSubmit,
    getFieldProps,
  };
}

// Hook for field-level state management
export function useFieldState<T>(
  initialValue: T,
  validation?: (value: T) => string | undefined
) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [dirty, setDirty] = useState(false);

  const validate = useCallback(() => {
    if (validation) {
      const errorMessage = validation(value);
      setError(errorMessage);
      return !errorMessage;
    }
    return true;
  }, [value, validation]);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    setDirty(newValue !== initialValue);
    if (validation) {
      const errorMessage = validation(newValue);
      setError(errorMessage);
    }
  }, [initialValue, validation]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate();
  }, [validate]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(undefined);
    setTouched(false);
    setDirty(false);
  }, [initialValue]);

  return {
    value,
    error,
    touched,
    dirty,
    setValue: handleChange,
    setError,
    setTouched,
    setDirty,
    validate,
    reset,
    onChange: handleChange,
    onBlur: handleBlur,
  };
}

// Hook for form validation only
export function useFormValidation<T extends Record<string, any>>(
  values: T,
  validationSchema?: z.ZodSchema<T>
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isValid, setIsValid] = useState(true);

  const validate = useCallback(() => {
    if (!validationSchema) {
      setErrors({});
      setIsValid(true);
      return true;
    }

    try {
      validationSchema.parse(values);
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.') as keyof T;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        setIsValid(false);
        return false;
      }
      return false;
    }
  }, [values, validationSchema]);

  const validateField = useCallback((field: keyof T) => {
    if (!validationSchema) return true;

    try {
      const fieldSchema = (validationSchema as any).shape?.[field as string];
      if (!fieldSchema) return true;

      fieldSchema.parse(values[field]);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues[0]?.message || 'Invalid value';
        setErrors(prev => ({ ...prev, [field]: errorMessage }));
        setIsValid(false);
        return false;
      }
      return false;
    }
  }, [values, validationSchema]);

  return {
    errors,
    isValid,
    validate,
    validateField,
  };
}
