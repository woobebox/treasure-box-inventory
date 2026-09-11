import type { ReactNode } from 'react';
import { cx } from './controlStyles';

const tones = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-rose-100 text-rose-800',
};

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={cx('inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold', tones[tone])}>{children}</span>;
}
