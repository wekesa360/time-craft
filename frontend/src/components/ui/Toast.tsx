import React from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

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

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: {
    container: 'bg-background border-border',
    icon: 'text-success',
    title: 'text-foreground',
    message: 'text-muted-foreground',
    progress: 'bg-success',
  },
  error: {
    container: 'bg-background border-border',
    icon: 'text-destructive',
    title: 'text-foreground',
    message: 'text-muted-foreground',
    progress: 'bg-destructive',
  },
  warning: {
    container: 'bg-background border-border',
    icon: 'text-warning',
    title: 'text-foreground',
    message: 'text-muted-foreground',
    progress: 'bg-warning',
  },
  info: {
    container: 'bg-background border-border',
    icon: 'text-info',
    title: 'text-foreground',
    message: 'text-muted-foreground',
    progress: 'bg-info',
  },
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
  const [progress, setProgress] = React.useState(100);
  const Icon = toastIcons[type];
  const styles = toastStyles[type];

  React.useEffect(() => {
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const decrement = (100 / duration) * 50; // Update every 50ms
        const newProgress = prev - decrement;
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 50);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Allow fade out animation
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all
        max-w-[420px] w-full
        ${isVisible ? 'opacity-100 translate-y-0 animate-in' : 'opacity-0 translate-y-2 animate-out'}
        ${styles.container}
        ${className}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="grid gap-1">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
          <div className="grid gap-1">
            <div className={`text-sm font-semibold ${styles.title}`}>
              {title}
            </div>
            {message && (
              <div className={`text-sm opacity-90 ${styles.message}`}>
                {message}
              </div>
            )}
            {action && (
              <div className="mt-2">
                <button
                  onClick={action.onClick}
                  className="text-sm font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm underline-offset-4 hover:underline"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <button
        onClick={handleClose}
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-border"
        aria-hidden="true"
      >
        <div
          className={`h-full ${styles.progress} transition-all duration-50 ease-linear`}
          style={{ width: `${progress}%` }}
        />
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
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-center': 'top-0 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={`
        fixed z-[100] flex flex-col gap-2 p-4 pointer-events-none
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
