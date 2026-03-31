'use client';

import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'prefix' | 'suffix'> {
  onChange: (value: string) => void;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function Input({
  placeholder,
  value,
  onChange,
  error,
  disabled,
  prefix,
  suffix,
  className,
  type = 'text',
  ...rest
}: InputProps) {
  return (
    <div className="w-full">
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border bg-white px-3 py-2',
          error ? 'border-danger' : 'border-border',
          disabled && 'opacity-50'
        )}
      >
        {prefix && <span className="text-textLight shrink-0">{prefix}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn('min-w-0 flex-1 bg-transparent text-sm outline-none', className)}
          {...rest}
        />
        {suffix && <span className="text-textLight shrink-0">{suffix}</span>}
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
