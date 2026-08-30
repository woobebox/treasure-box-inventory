export type ControlVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ControlSize = 'md' | 'lg';

export function cx(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

export const controlBase = 'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold touch-manipulation transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const controlVariants: Record<ControlVariant, string> = {
  primary: 'border-teal-700 bg-teal-700 text-white shadow-sm hover:border-teal-800 hover:bg-teal-800 active:border-teal-900 active:bg-teal-900',
  secondary: 'border-teal-200 bg-teal-50 text-teal-800 shadow-sm hover:border-teal-300 hover:bg-teal-100',
  ghost: 'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900',
  danger: 'border-rose-600 bg-rose-600 text-white shadow-sm hover:border-rose-700 hover:bg-rose-700 active:border-rose-800 active:bg-rose-800',
};

export const controlSizes: Record<ControlSize, string> = {
  md: 'min-h-12 px-4',
  lg: 'min-h-14 px-5 text-base',
};

export const iconButtonBase = 'inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation';

export const iconButtonVariants: Record<'ghost' | 'danger', string> = {
  ghost: 'border-transparent text-slate-600 hover:border-teal-100 hover:bg-teal-50 hover:text-teal-700',
  danger: 'border-transparent text-rose-700 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-800',
};
