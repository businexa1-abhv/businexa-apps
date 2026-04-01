import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Sign in with username and password',
};

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-secondary">Welcome back</h1>
      <p className="mt-2 text-center text-sm text-textLight">Use your username and password to sign in or create an account.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-textLight">
        <Link href="/" className="text-primary hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
