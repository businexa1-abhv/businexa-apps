'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function OTPInput({ length = 6, value, onChange, error }: OTPInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const chars = value.padEnd(length, ' ').slice(0, length).split('');

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const setAt = (i: number, digit: string) => {
    const next = value.split('');
    while (next.length < length) next.push('');
    next[i] = digit;
    onChange(next.join('').replace(/\s/g, '').slice(0, length));
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[i]?.trim() && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(t);
    const focusIdx = Math.min(t.length, length - 1);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div>
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={chars[i]?.trim() || ''}
            onPaste={onPaste}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, '').slice(-1);
              setAt(i, d);
              if (d && i < length - 1) inputs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => onKeyDown(i, e)}
            className={cn(
              'h-12 w-10 rounded-md border text-center text-lg font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30',
              error ? 'border-danger' : 'border-border'
            )}
          />
        ))}
      </div>
      {error ? <p className="mt-2 text-center text-xs text-danger">{error}</p> : null}
    </div>
  );
}
