'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type Toast = { id: number; message: string; type?: 'success' | 'error' | 'info' };

const NotificationContext = createContext<{
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
} | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ toasts, showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg px-4 py-2 text-sm shadow-lg ${
              t.type === 'error'
                ? 'bg-danger text-white'
                : t.type === 'success'
                  ? 'bg-success text-white'
                  : 'bg-secondary text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications outside NotificationProvider');
  return ctx;
}
