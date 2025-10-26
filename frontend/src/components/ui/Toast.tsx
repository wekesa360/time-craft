import React from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const toastStyles = {
  success: 'bg-success-light border-green-200 text-success dark:bg-success/20 dark:border-green-800 dark:text-success-light',
  error: 'bg-error-light border-red-200 text-error dark:bg-error/20 dark:border-red-800 dark:text-error-light',
  warning: 'bg-warning-light border-yellow-200 text-warning dark:bg-warning/20 dark:border-yellow-800 dark:text-warning-light',
  info: 'bg-info-light border-blue-200 text-info dark:bg-info/20 dark:border-blue-800 dark:text-info-light',
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
  className = '',
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        relative flex items-start p-4 border rounded-lg shadow-lg
        transition-all duration-300 ease-in-out
        ${toastStyles[type]}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {message && (
          <p className="mt-1 text-sm opacity-90">{message}</p>
        )}
        
        {action && (
          <div className="mt-3">
            <button
              onClick={action.onClick}
              className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
      
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleClose}
          className="inline-flex text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
  className = '',
}) => {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div
      className={`
        fixed z-50 flex flex-col space-y-2 max-w-sm w-full
        ${positionStyles[position]}
        ${className}
      `}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>>([]);

  const addToast = React.useCallback((toast: Omit<typeof toasts[0], 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = React.useCallback((title: string, message?: string, options?: Partial<typeof toasts[0]>) => {
    addToast({ type: 'success', title, message, ...options });
  }, [addToast]);

  const showError = React.useCallback((title: string, message?: string, options?: Partial<typeof toasts[0]>) => {
    addToast({ type: 'error', title, message, ...options });
  }, [addToast]);

  const showWarning = React.useCallback((title: string, message?: string, options?: Partial<typeof toasts[0]>) => {
    addToast({ type: 'warning', title, message, ...options });
  }, [addToast]);

  const showInfo = React.useCallback((title: string, message?: string, options?: Partial<typeof toasts[0]>) => {
    addToast({ type: 'info', title, message, ...options });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default Toast;
