'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const router = useRouter();
  const { sendOTP, isLoading, error, clearError } = useAuth();
  const [mobile, setMobile] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const checkUserExists = mode === 'login';
    const res = await sendOTP(mobile.replace(/\D/g, '').slice(-10), checkUserExists);
    if (res.success) {
      sessionStorage.setItem('businexa_otp_mobile', mobile.replace(/\D/g, '').slice(-10));
      sessionStorage.setItem('businexa_otp_mode', mode);
      router.push('/verify-otp');
    }
  };

  const digits = mobile.replace(/\D/g, '').slice(-10);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex rounded-lg border border-border p-1">
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-medium ${mode === 'login' ? 'bg-primary text-white' : ''}`}
          onClick={() => setMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-medium ${mode === 'signup' ? 'bg-primary text-white' : ''}`}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
      </div>
      <div>
        <label className="mb-1 block text-sm text-textLight">Mobile number</label>
        <Input
          type="tel"
          prefix={<span className="text-text">+91</span>}
          placeholder="9876543210"
          value={mobile}
          onChange={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
          error={error || undefined}
        />
        <p className="mt-1 text-xs text-textLight">10-digit Indian mobile (starts with 6–9)</p>
      </div>
      <Button type="submit" className="w-full" loading={isLoading} disabled={digits.length !== 10}>
        Send OTP
      </Button>
    </form>
  );
}
