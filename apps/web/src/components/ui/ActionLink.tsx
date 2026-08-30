import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { controlBase, controlSizes, controlVariants, cx, type ControlSize, type ControlVariant } from './controlStyles';

export interface ActionLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ControlVariant;
  size?: ControlSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function ActionLink({ variant = 'secondary', size = 'md', fullWidth = false, leadingIcon, trailingIcon, className, children, ...props }: ActionLinkProps) {
  return (
    <a
      {...props}
      className={cx(controlBase, controlVariants[variant], controlSizes[size], fullWidth && 'w-full', className)}
    >
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon ?? null}
    </a>
  );
}
