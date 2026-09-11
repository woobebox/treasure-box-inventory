import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './controlStyles';

interface SectionCardProps extends HTMLAttributes<HTMLElement> { children: ReactNode; }

export function SectionCard({ children, className, ...props }: SectionCardProps) {
  return <section {...props} className={cx('page-section', className)}>{children}</section>;
}
