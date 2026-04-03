'use client';

import { useState } from 'react';
import Link from 'next/link';
import { isValidLoginEmail } from '@businexa/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as api from '@/lib/api';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDevLink(null);
    const eNorm = email.trim().toLowerCase();
    if (!isValidLoginEmail(eNorm)) {
      setError('Enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.forgotPassword(eNorm);
      setDone(true);
      const d = data as { resetUrl?: string; message?: string };
      if (d.resetUrl) setDevLink(d.resetUrl);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center text-sm text-textLight">
        <p>
          If an account exists for this email, you will receive password reset instructions shortly. Check your inbox
          and spam folder.
        </p>
        {devLink ? (
          <p className="break-all rounded-md bg-border/50 p-3 text-left text-xs text-text">
            <span className="font-medium text-textLight">Development link:</span> {devLink}
          </p>
        ) : null}
        <Link href="/" className="inline-block text-primary hover:underline">
          ← Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-textLight">Email</label>
        <Input type="email" value={email} onChange={setEmail} autoComplete="email" error={error || undefined} />
      </div>
      <Button
        type="submit"
        className="w-full"
        loading={isLoading}
        disabled={!isValidLoginEmail(email.trim())}
      >
        Send reset link
      </Button>
      <p className="text-center text-sm">
        <Link href="/" className="text-primary hover:underline">
          ← Back to log in
        </Link>
      </p>
    </form>
  );
}
