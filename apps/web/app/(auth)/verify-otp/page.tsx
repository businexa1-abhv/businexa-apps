import type { Metadata } from 'next';
import { OTPVerification } from '@/components/auth/OTPVerification';

export const metadata: Metadata = {
  title: 'Verify OTP',
};

export default function VerifyOtpPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-secondary">Verify OTP</h1>
      <div className="mt-8">
        <OTPVerification />
      </div>
    </div>
  );
}
