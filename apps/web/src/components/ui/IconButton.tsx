import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx, iconButtonBase, iconButtonVariants } from './controlStyles';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'ghost' | 'danger';
  children: ReactNode;
}

export function IconButton({ variant = 'ghost', className, children, ...props }: IconButtonProps) {
  return <button {...props} className={cx(iconButtonBase, iconButtonVariants[variant], className)}>{children}</button>;
}
