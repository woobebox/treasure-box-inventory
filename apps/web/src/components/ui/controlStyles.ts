export type ControlVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ControlSize = 'md' | 'lg';

export function cx(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

export const controlBase = 'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold touch-manipulation transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const controlVariants: Record<ControlVariant, string> = {
  primary: 'border-[var(--ui-primary)] bg-[var(--ui-primary)] text-[var(--ui-on-primary)] shadow-sm hover:border-[var(--ui-primary-hover)] hover:bg-[var(--ui-primary-hover)]',
  secondary: 'border-[var(--ui-primary-soft-hover)] bg-[var(--ui-primary-soft)] text-[var(--ui-primary-hover)] shadow-sm hover:bg-[var(--ui-primary-soft-hover)]',
  ghost: 'border-transparent bg-transparent text-[var(--ui-text-muted)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)]',
  danger: 'border-[var(--ui-danger)] bg-[var(--ui-danger)] text-white shadow-sm hover:border-[var(--ui-danger-hover)] hover:bg-[var(--ui-danger-hover)]',
};

export const controlSizes: Record<ControlSize, string> = {
  md: 'min-h-12 px-4',
  lg: 'min-h-14 px-5 text-base',
};

export const iconButtonBase = 'inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation';

export const iconButtonVariants: Record<'ghost' | 'danger', string> = {
  ghost: 'border-transparent text-[var(--ui-text-muted)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-primary-soft)] hover:text-[var(--ui-primary)]',
  danger: 'border-transparent text-[var(--ui-danger)] hover:border-rose-100 hover:bg-rose-50 hover:text-[var(--ui-danger-hover)]',
};
