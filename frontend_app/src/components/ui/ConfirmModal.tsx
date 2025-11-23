'use client';

import { useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Shield,
  Lock,
} from 'lucide-react';
import { Button } from './Button';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const typeConfig: Record<ConfirmType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  danger: {
    icon: <Trash2 className="h-6 w-6" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  info: {
    icon: <Info className="h-6 w-6" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  success: {
    icon: <CheckCircle className="h-6 w-6" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  icon,
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const config = typeConfig[type];
  const displayIcon = icon || config.icon;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-800">
        {/* Close button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.bgColor}`}>
            <div className={config.color}>{displayIcon}</div>
          </div>

          {/* Title */}
          <h3 className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>

          {/* Message */}
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 ${
                type === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                  : type === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600'
                  : type === 'info'
                  ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

