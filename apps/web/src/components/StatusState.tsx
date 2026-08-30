import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';
import { Button } from './ui';

interface StatusStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface LoadingStateProps {
  label?: string;
  rows?: number;
}

export function LoadingState({ label = '正在載入資料…', rows = 3 }: LoadingStateProps) {
  return (
    <section role="status" aria-label={label} className="page-section space-y-3 overflow-hidden">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-teal-700" />
        <span>{label}</span>
      </div>
      <div aria-hidden="true" className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="loading-skeleton h-16 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

export function EmptyState(props: StatusStateProps) {
  return <StatusState tone="empty" {...props} />;
}

export function ErrorState(props: StatusStateProps) {
  return <StatusState tone="error" {...props} />;
}

function StatusState({ title, message, actionLabel, onAction, tone }: StatusStateProps & { tone: 'empty' | 'error' }) {
  const Icon = tone === 'error' ? AlertTriangle : Inbox;
  return (
    <section role={tone === 'error' ? 'alert' : 'status'} className={`rounded-3xl border p-6 text-center ${tone === 'error' ? 'border-rose-200 bg-rose-50' : 'border-teal-100 bg-white'}`}>
      <Icon aria-hidden="true" className={`mx-auto h-8 w-8 ${tone === 'error' ? 'text-rose-700' : 'text-teal-700'}`} />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      {actionLabel && onAction ? <Button type="button" variant={tone === 'error' ? 'secondary' : 'primary'} className="mt-4" onClick={onAction}>{actionLabel}</Button> : null}
    </section>
  );
}
