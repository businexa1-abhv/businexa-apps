'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

/**
 * Shared login / sign-up card (used at `/` and historically at `/login`).
 */
export function AuthEntryContent() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-secondary">Welcome back</h1>
      <p className="mt-2 text-center text-sm text-textLight">
        Use your username and password to sign in or create an account.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-textLight">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password
        </Link>
        {' · '}
        <Link href="/terms" className="text-primary hover:underline">
          Terms
        </Link>
      </p>
    </div>
  );
}
