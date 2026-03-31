'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

type Padding = 'sm' | 'md' | 'lg';

const paddings: Record<Padding, string> = {
  sm: 'p-3',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: Padding;
  shadow?: boolean;
  clickable?: boolean;
}

export function Card({
  children,
  padding = 'md',
  shadow = true,
  clickable,
  className,
  onClick,
  ...rest
}: CardProps) {
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border bg-surface text-text',
        shadow && 'shadow-sm',
        clickable && 'cursor-pointer hover:border-primary/40 transition',
        paddings[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
