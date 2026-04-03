'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { validatePasswordStrength, passwordRequirementsShort } from '@businexa/shared';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import * as api from '@/lib/api';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pwCheck = validatePasswordStrength(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pwCheck.ok) {
      setError(pwCheck.message || 'Invalid password');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Missing token. Open the link from your email.');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.resetPassword(token, password);
      if (!(data as { success?: boolean }).success) {
        setError((data as { message?: string }).message || 'Reset failed');
        return;
      }
      setDone(true);
      setTimeout(() => router.replace('/'), 2000);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <p className="text-center text-sm text-textLight">
        Password updated. Redirecting to log in…
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!token ? (
        <p className="text-sm text-danger">Invalid or missing reset link.</p>
      ) : null}
      <p className="text-xs text-textLight">{passwordRequirementsShort()}</p>
      <div>
        <label className="mb-1 block text-sm text-textLight">New password</label>
        <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-textLight">Confirm password</label>
        <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button
        type="submit"
        className="w-full"
        loading={isLoading}
        disabled={!token || !pwCheck.ok || password !== confirm}
      >
        Update password
      </Button>
      <p className="text-center text-sm">
        <Link href="/" className="text-primary hover:underline">
          ← Back to log in
        </Link>
      </p>
    </form>
  );
}
