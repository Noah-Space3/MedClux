'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 w-full max-w-sm px-4 sm:px-0 pointer-events-none"
      >
        {toasts.map((t) => {
          const Icon =
            t.variant === 'success'
              ? CheckCircle2
              : t.variant === 'error'
              ? AlertCircle
              : t.variant === 'warning'
              ? AlertTriangle
              : Info;

          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-elevated bg-white transition-all',
                t.variant === 'success' && 'border-emerald-200 bg-emerald-50/95 text-emerald-950',
                t.variant === 'error' && 'border-red-200 bg-red-50/95 text-red-950',
                t.variant === 'warning' && 'border-amber-200 bg-amber-50/95 text-amber-950',
                t.variant === 'info' && 'border-slate-200 bg-white text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 mt-0.5',
                  t.variant === 'success' && 'text-emerald-600',
                  t.variant === 'error' && 'text-red-600',
                  t.variant === 'warning' && 'text-amber-600',
                  t.variant === 'info' && 'text-brand-600'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-5">{t.title}</p>
                {t.description && (
                  <p className="mt-1 text-xs leading-relaxed opacity-90">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                className="rounded p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
