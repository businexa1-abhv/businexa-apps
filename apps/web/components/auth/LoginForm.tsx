'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  validatePasswordStrength,
  passwordRequirementsShort,
  isValidLoginEmail,
} from '@businexa/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/hooks/useAuth';
import type { RegisterPasswordPayload } from '@/types/api';

export function LoginForm() {
  const router = useRouter();
  const { registerWithPassword, loginWithPassword, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [accountRole, setAccountRole] = useState<'buyer' | 'seller'>('buyer');

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');

  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [shopWhatsapp, setShopWhatsapp] = useState('');

  const emailOk = isValidLoginEmail(email.trim());
  const pwCheck = validatePasswordStrength(password);
  const pwOk = pwCheck.ok;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const u = email.trim().toLowerCase();
    if (!isValidLoginEmail(u)) return;
    if (mode === 'login') {
      const res = await loginWithPassword(u, password);
      if (res.success) {
        router.replace('/dashboard');
      }
      return;
    }

    if (!pwOk) return;
    if (password !== confirmPassword) return;
    if (accountRole === 'seller') {
      if (!shopName.trim() || !shopAddress.trim()) return;
    }

    const digits = mobile.replace(/\D/g, '');
    const payload: RegisterPasswordPayload = {
      username: u,
      password,
      role: accountRole,
      profile: {
        fullName: fullName.trim(),
        ...(digits.length === 10 ? { mobileNumber: digits } : {}),
      },
    };

    if (accountRole === 'seller') {
      const wa = shopWhatsapp.replace(/\D/g, '');
      payload.shop = {
        name: shopName.trim(),
        address: shopAddress.trim(),
        category: shopCategory.trim(),
        description: shopDescription.trim(),
        email: shopEmail.trim(),
        whatsappNumber: wa.length === 10 ? wa : '',
      };
    }

    const res = await registerWithPassword(payload);
    if (!res.success) return;

    if (accountRole === 'buyer') {
      router.replace('/');
    } else {
      router.replace('/dashboard');
    }
  };

  const canSubmitLogin = emailOk && password.length >= 1;
  const canSubmitSignup =
    emailOk &&
    pwOk &&
    password === confirmPassword &&
    (accountRole === 'buyer' || (shopName.trim().length > 0 && shopAddress.trim().length > 0));

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
        <label className="mb-1 block text-sm text-textLight">Email</label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          error={mode === 'login' ? error || undefined : undefined}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-textLight">Password</label>
        <PasswordInput
          value={password}
          onChange={setPassword}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        {mode === 'signup' ? (
          <p className="mt-1 text-xs text-textLight">{passwordRequirementsShort()}</p>
        ) : null}
        {mode === 'signup' && password.length > 0 && !pwOk ? (
          <p className="mt-1 text-xs text-danger">{pwCheck.message}</p>
        ) : null}
      </div>

      {mode === 'signup' ? (
        <>
          <div>
            <label className="mb-1 block text-sm text-textLight">Confirm password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
            {confirmPassword && password !== confirmPassword ? (
              <p className="mt-1 text-xs text-danger">Passwords do not match</p>
            ) : null}
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-secondary">I am registering as</legend>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <input
                type="radio"
                name="role"
                checked={accountRole === 'buyer'}
                onChange={() => setAccountRole('buyer')}
                className="text-primary"
              />
              <span>
                <span className="font-medium text-secondary">Buyer</span>
                <span className="block text-xs text-textLight">Browse shops and products</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <input
                type="radio"
                name="role"
                checked={accountRole === 'seller'}
                onChange={() => setAccountRole('seller')}
                className="text-primary"
              />
              <span>
                <span className="font-medium text-secondary">Seller</span>
                <span className="block text-xs text-textLight">Create a shop and list products</span>
              </span>
            </label>
          </fieldset>

          <div className="rounded-lg border border-border bg-background/50 p-4">
            <p className="mb-3 text-sm font-medium text-secondary">Your details</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-textLight">Full name (optional)</label>
                <Input type="text" value={fullName} onChange={setFullName} autoComplete="name" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-textLight">Mobile (optional, 10 digits)</label>
                <Input type="tel" value={mobile} onChange={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))} />
              </div>
            </div>
          </div>

          {accountRole === 'seller' ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="mb-3 text-sm font-medium text-secondary">Shop & owner</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-textLight">Shop name *</label>
                  <Input type="text" value={shopName} onChange={setShopName} placeholder="My Store" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-textLight">Shop address *</label>
                  <Input
                    type="text"
                    value={shopAddress}
                    onChange={setShopAddress}
                    placeholder="Street, area, city, PIN"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-textLight">Category (optional)</label>
                  <Input type="text" value={shopCategory} onChange={setShopCategory} placeholder="e.g. Grocery" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-textLight">Description (optional)</label>
                  <textarea
                    value={shopDescription}
                    onChange={(e) => setShopDescription(e.target.value)}
                    className="min-h-[80px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="What do you sell?"
                    maxLength={2000}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-textLight">Shop contact email (optional)</label>
                  <Input type="email" value={shopEmail} onChange={setShopEmail} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-textLight">WhatsApp (optional, 10 digits)</label>
                  <Input
                    type="tel"
                    value={shopWhatsapp}
                    onChange={(v) => setShopWhatsapp(v.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-center text-sm text-danger">{error}</p> : null}
        </>
      ) : (
        <>
          {error ? <p className="text-center text-sm text-danger">{error}</p> : null}
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-secondary hover:underline">
              Forgot password?
            </Link>
          </p>
        </>
      )}

      <Button
        type="submit"
        className="w-full"
        loading={isLoading}
        disabled={mode === 'login' ? !canSubmitLogin : !canSubmitSignup}
      >
        {mode === 'login' ? 'Log in' : 'Create account'}
      </Button>
    </form>
  );
}
