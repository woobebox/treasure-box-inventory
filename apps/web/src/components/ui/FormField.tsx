import type { ReactNode } from 'react';

interface FormFieldProps { id: string; label: string; required?: boolean; error?: string; hint?: string; children: ReactNode; }

export function FormField({ id, label, required = false, error, hint, children }: FormFieldProps) {
  return <div>
    <label className="text-sm font-medium text-[var(--ui-text)]" htmlFor={id}>{label}{required ? <span className="text-[var(--ui-danger)]"> *</span> : null}</label>
    {children}
    {error ? <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-[var(--ui-danger)]">{error}</p> : hint ? <p id={`${id}-hint`} className="mt-1 text-xs text-[var(--ui-text-muted)]">{hint}</p> : null}
  </div>;
}
