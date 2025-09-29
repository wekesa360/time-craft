import React from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-background card max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-foreground-secondary">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`btn flex-1 ${
                variant === 'danger' 
                  ? 'btn-primary bg-red-600 hover:bg-red-700' 
                  : 'btn-primary'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
