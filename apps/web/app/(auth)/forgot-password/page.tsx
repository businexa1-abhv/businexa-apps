import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Reset your Businexa password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-secondary">Forgot password</h1>
      <p className="mt-2 text-center text-sm text-textLight">
        Enter the email you use to log in. We will send a confirmation link if an account exists.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm text-textLight">
        <Link href="/" className="text-primary hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
