import React, { useEffect, useState } from 'react';
import { Toaster, ToastBar } from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const ToastProgressBar: React.FC<{ toast: any }> = ({ toast }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.visible) return;
    
    const duration = toast.duration || 5000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - toast.createdAt;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    return () => clearInterval(interval);
  }, [toast.visible, toast.createdAt, toast.duration]);

  const progressColor = 
    toast.type === 'success' ? 'bg-success' :
    toast.type === 'error' ? 'bg-destructive' :
    toast.type === 'warning' ? 'bg-warning' :
    'bg-info';

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-1 bg-border"
      aria-hidden="true"
    >
      <div
        className={`h-full transition-all duration-50 ease-linear ${progressColor}`}
        style={{ 
          width: `${progress}%`,
          transition: 'width 50ms linear'
        }}
      />
    </div>
  );
};

export const ShadcnToaster = () => {
  return (
    <Toaster
      position="top-right"
      containerClassName="!top-4 !right-4"
      toastOptions={{
        duration: 5000,
        className: '',
        style: {
          background: 'transparent',
          color: 'inherit',
          border: 'none',
          borderRadius: '0',
          padding: 0,
          boxShadow: 'none',
        },
      }}
    >
      {(t) => {
        const Icon = toastIcons[t.type as keyof typeof toastIcons] || Info;
        const iconColor = 
          t.type === 'success' ? 'text-success' :
          t.type === 'error' ? 'text-destructive' :
          t.type === 'warning' ? 'text-warning' :
          'text-info';

        return (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all bg-background border-border max-w-[420px]">
                <div className="grid gap-1 flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className={`${iconColor} flex-shrink-0 mt-0.5`}>
                      {icon || <Icon className="h-5 w-5" />}
                    </div>
                    <div className="grid gap-1 flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground break-words">
                        {typeof message === 'string' ? message : React.isValidElement(message) ? message : String(t.message || '')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => t.dismiss(t.id)}
                  className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <ToastProgressBar toast={t} />
              </div>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );
};

