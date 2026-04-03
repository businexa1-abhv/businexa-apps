'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';

const GlobalApiLoader = dynamic(() =>
  import('@/components/GlobalApiLoader').then((m) => ({ default: m.GlobalApiLoader }))
);
const SessionIdleGuard = dynamic(
  () => import('@/components/auth/SessionIdleGuard').then((m) => ({ default: m.SessionIdleGuard })),
  { ssr: false }
);

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        {children}
        <GlobalApiLoader />
        <SessionIdleGuard />
      </NotificationProvider>
    </ThemeProvider>
  );
}
