'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/ui/OTPInput';
import { useAuth } from '@/hooks/useAuth';

const RESEND_SEC = 60;

export function OTPVerification() {
  const router = useRouter();
  const { verifyOTP, sendOTP, isLoading, error, clearError } = useAuth();
  const [otp, setOtp] = useState('');
  const [mobile, setMobile] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [timer, setTimer] = useState(0);
  const submitOnce = useRef(false);

  useEffect(() => {
    const m = sessionStorage.getItem('businexa_otp_mobile');
    const md = sessionStorage.getItem('businexa_otp_mode') as 'login' | 'signup' | null;
    if (!m) {
      router.replace('/login');
      return;
    }
    setMobile(m);
    if (md === 'signup' || md === 'login') setMode(md);
    setTimer(RESEND_SEC);
  }, [router]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  useEffect(() => {
    if (otp.length !== 6 || submitOnce.current || !mobile) return;
    submitOnce.current = true;
    void submit(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const submit = async (code: string) => {
    clearError();
    const role = 'seller' as const;
    const res = await verifyOTP(mobile, code, role);
    if (!res.success) {
      submitOnce.current = false;
      return;
    }
    sessionStorage.removeItem('businexa_otp_mobile');
    sessionStorage.removeItem('businexa_otp_mode');
    if (res.isNewUser) {
      router.replace('/business-details');
    } else {
      router.replace('/dashboard');
    }
  };

  const resend = async () => {
    if (timer > 0 || !mobile) return;
    clearError();
    await sendOTP(mobile, mode === 'login');
    setTimer(RESEND_SEC);
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-textLight">
        Enter the code sent to <span className="font-medium text-text">+91 {mobile}</span>
      </p>
      <OTPInput value={otp} onChange={setOtp} error={error || undefined} />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Link href="/login" className="text-sm text-secondary hover:underline">
          ← Change number
        </Link>
        <Button type="button" variant="outline" size="sm" disabled={timer > 0 || isLoading} onClick={() => resend()}>
          {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
        </Button>
      </div>
      <Button type="button" className="w-full" loading={isLoading} onClick={() => submit(otp)} disabled={otp.length !== 6}>
        Verify & continue
      </Button>
    </div>
  );
}
