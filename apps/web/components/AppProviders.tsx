'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { GlobalApiLoader } from '@/components/GlobalApiLoader';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        {children}
        <GlobalApiLoader />
      </NotificationProvider>
    </ThemeProvider>
  );
}
