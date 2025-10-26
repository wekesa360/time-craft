import React, { forwardRef } from 'react';
import { useFormState } from '../../hooks/useFormState';
import { useAccessibilityContext } from '../accessibility/AccessibilityProvider';

interface FormFieldProps<T> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children: (props: {
    value: T;
    onChange: (value: T) => void;
    onBlur: () => void;
    error?: string;
    touched: boolean;
    dirty: boolean;
    required: boolean;
    disabled: boolean;
    id: string;
    'aria-describedby'?: string;
  }) => React.ReactNode;
}

export const FormField = <T,>({
  name,
  label,
  description,
  required = false,
  disabled = false,
  className = '',
  children,
}: FormFieldProps<T>) => {
  const { announce } = useAccessibilityContext();
  const formState = useFormState({ initialValues: {} as any }); // This would be provided by parent form

  const fieldId = `field-${name}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = `${fieldId}-error`;

  const fieldProps = {
    value: formState.values[name as keyof typeof formState.values] as T,
    onChange: (value: T) => {
      formState.setValue(name as keyof typeof formState.values, value as any);
      announce(`Field ${name} updated`);
    },
    onBlur: () => {
      formState.setTouched(name as keyof typeof formState.values);
    },
    error: formState.errors[name as keyof typeof formState.errors],
    touched: formState.touched[name as keyof typeof formState.touched] || false,
    dirty: formState.dirty[name as keyof typeof formState.dirty] || false,
    required,
    disabled,
    id: fieldId,
    'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
  };

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className={`block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1 ${
            required ? 'after:content-["*"] after:text-error-light0 after:ml-1' : ''
          }`}
        >
          {label}
        </label>
      )}
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">
          {description}
        </p>
      )}

      <div className="relative">
        {children(fieldProps)}
        
        {fieldProps.error && fieldProps.touched && (
          <div
            id={errorId}
            className="mt-1 text-sm text-error dark:text-error-light"
            role="alert"
            aria-live="polite"
          >
            {fieldProps.error}
          </div>
        )}
      </div>
    </div>
  );
};

// Input field component
interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'> {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched: boolean;
  dirty: boolean;
  required: boolean;
  disabled: boolean;
  id: string;
  'aria-describedby'?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ value, onChange, onBlur, error, touched, dirty, required, disabled, id, 'aria-describedby': ariaDescribedBy, className = '', ...props }, ref) => {
    const { isKeyboardUser } = useAccessibilityContext();

    return (
      <input
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : 'false'}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-muted disabled:cursor-not-allowed
          ${error && touched ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${isKeyboardUser ? 'focus:ring-2 focus:ring-blue-500' : ''}
          dark:bg-muted dark:text-white dark:placeholder-gray-500
          ${className}
        `}
        {...props}
      />
    );
  }
);

InputField.displayName = 'InputField';

// Textarea field component
interface TextareaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'onBlur'> {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched: boolean;
  dirty: boolean;
  required: boolean;
  disabled: boolean;
  id: string;
  'aria-describedby'?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ value, onChange, onBlur, error, touched, dirty, required, disabled, id, 'aria-describedby': ariaDescribedBy, className = '', ...props }, ref) => {
    const { isKeyboardUser } = useAccessibilityContext();

    return (
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : 'false'}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-muted disabled:cursor-not-allowed
          ${error && touched ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${isKeyboardUser ? 'focus:ring-2 focus:ring-blue-500' : ''}
          dark:bg-muted dark:text-white dark:placeholder-gray-500
          ${className}
        `}
        {...props}
      />
    );
  }
);

TextareaField.displayName = 'TextareaField';

// Select field component
interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'onBlur'> {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched: boolean;
  dirty: boolean;
  required: boolean;
  disabled: boolean;
  id: string;
  'aria-describedby'?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ value, onChange, onBlur, error, touched, dirty, required, disabled, id, 'aria-describedby': ariaDescribedBy, options, placeholder, className = '', ...props }, ref) => {
    const { isKeyboardUser } = useAccessibilityContext();

    return (
      <select
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : 'false'}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-muted disabled:cursor-not-allowed
          ${error && touched ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${isKeyboardUser ? 'focus:ring-2 focus:ring-blue-500' : ''}
          dark:bg-muted dark:text-white
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

SelectField.displayName = 'SelectField';

// Checkbox field component
interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'> {
  value: boolean;
  onChange: (value: boolean) => void;
  onBlur: () => void;
  error?: string;
  touched: boolean;
  dirty: boolean;
  required: boolean;
  disabled: boolean;
  id: string;
  'aria-describedby'?: string;
  label?: string;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ value, onChange, onBlur, error, touched, dirty, required, disabled, id, 'aria-describedby': ariaDescribedBy, label, className = '', ...props }, ref) => {
    const { isKeyboardUser } = useAccessibilityContext();

    return (
      <div className={`flex items-center ${className}`}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? 'true' : 'false'}
          className={`
            h-4 w-4 text-info focus:ring-blue-500 border-gray-300 rounded
            disabled:bg-muted disabled:cursor-not-allowed
            ${error && touched ? 'border-red-500' : ''}
            ${isKeyboardUser ? 'focus:ring-2' : ''}
            dark:bg-muted dark:border-gray-600
          `}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="ml-2 block text-sm text-muted-foreground dark:text-muted-foreground">
            {label}
          </label>
        )}
      </div>
    );
  }
);

CheckboxField.displayName = 'CheckboxField';

// Radio field component
interface RadioFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'> {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched: boolean;
  dirty: boolean;
  required: boolean;
  disabled: boolean;
  id: string;
  'aria-describedby'?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  name: string;
}

export const RadioField = forwardRef<HTMLInputElement, RadioFieldProps>(
  ({ value, onChange, onBlur, error, touched, dirty, required, disabled, id, 'aria-describedby': ariaDescribedBy, options, name, className = '', ...props }, ref) => {
    const { isKeyboardUser } = useAccessibilityContext();

    return (
      <div className={`space-y-2 ${className}`}>
        {options.map((option, index) => (
          <div key={option.value} className="flex items-center">
            <input
              ref={index === 0 ? ref : undefined}
              id={`${id}-${option.value}`}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              required={required}
              disabled={disabled || option.disabled}
              aria-describedby={ariaDescribedBy}
              aria-invalid={error ? 'true' : 'false'}
              className={`
                h-4 w-4 text-info focus:ring-blue-500 border-gray-300
                disabled:bg-muted disabled:cursor-not-allowed
                ${error && touched ? 'border-red-500' : ''}
                ${isKeyboardUser ? 'focus:ring-2' : ''}
                dark:bg-muted dark:border-gray-600
              `}
              {...props}
            />
            <label
              htmlFor={`${id}-${option.value}`}
              className="ml-2 block text-sm text-muted-foreground dark:text-muted-foreground"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    );
  }
);

RadioField.displayName = 'RadioField';
