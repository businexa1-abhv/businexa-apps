import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Set a new Businexa password',
};

export default function ResetPasswordPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-secondary">Set new password</h1>
      <p className="mt-2 text-center text-sm text-textLight">Choose a strong password you have not used elsewhere.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-center text-sm text-textLight">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-textLight">
        <Link href="/" className="text-primary hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
