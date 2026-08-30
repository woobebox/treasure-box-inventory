import { LoaderCircle } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { controlBase, controlSizes, controlVariants, cx, type ControlSize, type ControlVariant } from './controlStyles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ControlVariant;
  size?: ControlSize;
  busy?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', size = 'md', busy = false, fullWidth = false, leadingIcon, className, children, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      {...props}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cx(controlBase, controlVariants[variant], controlSizes[size], fullWidth && 'w-full', className)}
    >
      {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : leadingIcon}
      {busy ? '處理中…' : children}
    </button>
  );
});
