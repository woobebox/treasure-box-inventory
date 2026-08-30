import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { IconButton } from '../ui';
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
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    const duration = variant === 'error' ? 8000 : variant === 'info' ? 5000 : 4000;
    timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
  }, [dismiss]);

  useEffect(() => () => {
    for (const timer of timers.current.values()) window.clearTimeout(timer);
    timers.current.clear();
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6" aria-label="通知">
        {toasts.map((toast) => (
          <div key={toast.id} role={toast.variant === 'error' ? 'alert' : 'status'} className={`toast-enter pointer-events-auto flex min-h-12 w-full max-w-sm items-center gap-2 rounded-2xl py-2 pl-4 pr-2 text-sm font-medium shadow-lg ${variantClass[toast.variant]}`}>
            <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
            <IconButton type="button" aria-label="關閉通知" onClick={() => dismiss(toast.id)} className="rounded-xl border-white/20 text-white hover:border-white/30 hover:bg-white/15 hover:text-white focus-visible:ring-white focus-visible:ring-offset-slate-800">
              <X aria-hidden="true" className="h-4 w-4" />
            </IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
