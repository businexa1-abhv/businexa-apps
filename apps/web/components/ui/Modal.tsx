'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'outline' }[];
}

export function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl',
          'max-h-[90vh] overflow-y-auto'
        )}
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="text-lg font-semibold text-secondary">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
        {actions?.length ? (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {actions.map((a) => (
              <Button key={a.label} variant={a.variant || 'primary'} onClick={a.onClick}>
                {a.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
