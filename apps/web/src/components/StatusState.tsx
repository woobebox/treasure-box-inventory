interface StatusStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState(props: StatusStateProps) {
  return <StatusState tone="empty" {...props} />;
}

export function ErrorState(props: StatusStateProps) {
  return <StatusState tone="error" {...props} />;
}

function StatusState({ title, message, actionLabel, onAction, tone }: StatusStateProps & { tone: 'empty' | 'error' }) {
  return (
    <section className={`rounded-3xl border p-6 text-center ${tone === 'error' ? 'border-red-200 bg-red-50' : 'border-teal-100 bg-white'}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      {actionLabel && onAction ? <button className="mt-4 rounded-full bg-teal-700 px-4 py-2 text-white" onClick={onAction}>{actionLabel}</button> : null}
    </section>
  );
}
