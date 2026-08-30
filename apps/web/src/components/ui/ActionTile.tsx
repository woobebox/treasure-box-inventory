import { ArrowRight } from 'lucide-react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cx } from './controlStyles';

export interface ActionTileProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: 'teal' | 'slate' | 'amber';
}

const toneClasses = {
  teal: 'border-teal-100 bg-teal-50/80 text-teal-900 hover:border-teal-300 hover:bg-teal-50',
  slate: 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white',
  amber: 'border-amber-100 bg-amber-50/80 text-amber-950 hover:border-amber-300 hover:bg-amber-50',
};

export function ActionTile({ icon, title, description, tone = 'teal', className, ...props }: ActionTileProps) {
  return (
    <a
      {...props}
      className={cx('group flex min-h-36 cursor-pointer items-center gap-4 rounded-3xl border p-5 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.99] touch-manipulation', toneClasses[tone], className)}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/85 shadow-sm ring-1 ring-black/5 [&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold">{title}</span>
        <span className="mt-1 block text-sm leading-5 opacity-70">{description}</span>
      </span>
      <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 opacity-60 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  );
}
