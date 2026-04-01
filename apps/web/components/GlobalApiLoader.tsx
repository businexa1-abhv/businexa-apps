'use client';

import { useEffect } from 'react';
import { useApiLoadingStore } from '@/lib/apiLoadingStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * One app-wide overlay while any `apiClient` request is in flight (unless skipped via header).
 */
export function GlobalApiLoader() {
  const pending = useApiLoadingStore((s) => s.pending);
  const active = pending > 0;

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-8 py-6 shadow-lg">
        <LoadingSpinner className="h-10 w-10" />
        <p className="text-sm font-medium text-secondary">Loading…</p>
      </div>
    </div>
  );
}
