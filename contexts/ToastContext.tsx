'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36);
    const newToast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  };

  const showSuccess = (message: string, duration?: number) => showToast(message, 'success', duration);
  const showError = (message: string, duration?: number) => showToast(message, 'error', duration || 7000); // Errors stay longer
  const showWarning = (message: string, duration?: number) => showToast(message, 'warning', duration || 6000);
  const showInfo = (message: string, duration?: number) => showToast(message, 'info', duration);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-dark flex-shrink-0" />;
      case 'error':
        return <AlertCircle size={20} className="text-dark flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-dark flex-shrink-0" />;
      case 'info':
        return <Info size={20} className="text-dark flex-shrink-0" />;
    }
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-cool-blue border-cool-blue';
      case 'error':
        return 'bg-alert-orange border-alert-orange';
      case 'warning':
        return 'bg-alert-orange/70 border-alert-orange';
      case 'info':
        return 'bg-white border-dark';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              border-4 ${getToastColors(toast.type)}
              p-4 shadow-[8px_8px_0px_0px_rgba(18,18,18,1)]
              animate-slide-in
              flex items-start gap-3
            `}
          >
            {getToastIcon(toast.type)}
            <p className="flex-1 text-dark font-medium text-sm leading-relaxed">
              {toast.message}
            </p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={20} className="text-dark" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
