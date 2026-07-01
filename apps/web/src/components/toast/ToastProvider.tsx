import { useCallback, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { ToastContext, type ToastVariant } from './toastContext';

interface ToastItem { id: number; message: string; variant: ToastVariant; }

const variantClass: Record<ToastVariant, string> = {
  success: 'bg-teal-700 text-white',
  error: 'bg-rose-600 text-white',
  info: 'bg-slate-800 text-white'
};

// Lightweight transient toast: messages stack at the bottom of the viewport and
// auto-dismiss after a few seconds; they can also be dismissed by tapping.
export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((toast) => toast.id !== id)), []);

  const show = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((toast) => (
          <button key={toast.id} type="button" onClick={() => dismiss(toast.id)} className={`toast-enter pointer-events-auto max-w-sm rounded-2xl px-4 py-2 text-sm font-medium shadow-lg ${variantClass[toast.variant]}`}>
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
