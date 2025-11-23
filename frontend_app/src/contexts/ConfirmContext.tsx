'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmModal, ConfirmType } from '@/components/ui/ConfirmModal';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  icon?: React.ReactNode;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions & { resolve: (value: boolean) => void } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = useCallback((confirmOptions: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        ...confirmOptions,
        resolve,
      });
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    if (!isLoading && options) {
      setIsOpen(false);
      options.resolve(false);
      setTimeout(() => {
        setOptions(null);
      }, 300);
    }
  }, [isLoading, options]);

  const handleConfirm = useCallback(async () => {
    if (!options || isLoading) return;

    setIsLoading(true);
    try {
      // Resolve immediately with true
      options.resolve(true);
      setIsOpen(false);
      setTimeout(() => {
        setOptions(null);
        setIsLoading(false);
      }, 300);
    } catch (error) {
      setIsLoading(false);
      console.error('Confirmation action failed:', error);
    }
  }, [options, isLoading]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <ConfirmModal
          isOpen={isOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={options.title}
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          type={options.type}
          icon={options.icon}
          isLoading={isLoading}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
}

