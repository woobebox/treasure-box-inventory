import { createContext, useContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';
export interface ToastContextValue { show: (message: string, variant?: ToastVariant) => void; }

export const ToastContext = createContext<ToastContextValue>({ show: () => undefined });
export function useToast(): ToastContextValue { return useContext(ToastContext); }
