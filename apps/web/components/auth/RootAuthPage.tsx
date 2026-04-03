'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '@/lib/storage';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const AuthEntryContent = dynamic(
  () => import('@/components/auth/AuthEntryContent').then((m) => ({ default: m.AuthEntryContent })),
  { loading: () => <LoadingSpinner /> }
);

/**
 * `/` — with a stored JWT (or Firebase ID token), send users straight to the app.
 * Validation happens on `/dashboard` via `useAuth` + API; do not block on `getMe` here
 * (avoids showing login when the session is fine but the check failed transiently).
 */
export function RootAuthPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setShowForm(true);
      return;
    }
    router.replace('/dashboard');
  }, [router]);

  if (showForm) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <AuthEntryContent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <LoadingSpinner />
      <p className="mt-4 text-sm text-textLight">Loading…</p>
    </div>
  );
}
