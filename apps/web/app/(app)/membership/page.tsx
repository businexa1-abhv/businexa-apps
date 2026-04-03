'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import * as api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import type { BuyerPlan } from '@/types';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export default function BuyerMembershipPage() {
  const router = useRouter();
  const userRole = useAuthStore((s) => s.user?.role);
  const buyerAccess = useAuthStore((s) => s.user?.buyerAccess);
  const { showToast } = useNotifications();
  const { refreshProfile } = useAuth();
  const [plans, setPlans] = useState<BuyerPlan[]>([]);
  const [subs, setSubs] = useState<unknown[]>([]);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userRole && userRole !== 'buyer') {
      router.replace('/dashboard');
    }
  }, [userRole, router]);

  useEffect(() => {
    if (userRole !== 'buyer') return;
    api
      .getBuyerPlans()
      .then(({ data }) => setPlans((data.plans as BuyerPlan[]) || []))
      .catch(() => {});
    api
      .listBuyerSubscriptions()
      .then(({ data }) => setSubs((data.subscriptions as unknown[]) || []))
      .catch(() => {});
  }, [userRole]);

  const pay = async (plan: BuyerPlan) => {
    if (!window.Razorpay) {
      showToast('Payment script loading', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.createBuyerOrder(plan.id);
      const order = data as {
        orderId: string;
        amount: number;
        currency: string;
        razorpayKeyId: string;
      };
      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Businexa Plus',
        description: plan.name,
        order_id: order.orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await api.verifyBuyerPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId: plan.id,
            });
            showToast('Welcome to Businexa Plus', 'success');
            await refreshProfile();
            const r = await api.listBuyerSubscriptions();
            setSubs((r.data.subscriptions as unknown[]) || []);
          } catch {
            showToast('Verification failed', 'error');
          }
        },
        theme: { color: '#FF6B35' },
      });
      rzp.open();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Payment failed';
      showToast(msg || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!userRole) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (userRole !== 'buyer') {
    return <p className="text-textLight">Redirecting…</p>;
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRazorpayReady(true)} />
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-background p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Buyer membership</p>
          <h1 className="mt-2 text-2xl font-bold text-secondary sm:text-3xl">Businexa Plus</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-textLight sm:text-base">
            Full access to every shop page, product catalog, and QR tools. New accounts get{' '}
            <strong className="text-secondary">one free day</strong> automatically — then pick a plan to continue.
          </p>
          {buyerAccess?.canAccessPremium ? (
            <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-secondary">
              {buyerAccess.hasActiveSubscription
                ? 'Your Plus membership is active.'
                : 'You’re in your free access window — subscribe anytime to stay uninterrupted.'}
            </p>
          ) : (
            <p className="mt-4 text-sm font-medium text-primary">Subscribe to restore full access.</p>
          )}
        </div>

        {!razorpayReady ? <p className="text-sm text-textLight">Loading secure checkout…</p> : null}

        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className="flex flex-col border-primary/15 p-5">
              <h2 className="font-semibold text-secondary">{p.name}</h2>
              <p className="mt-3 text-2xl font-bold text-primary">{formatPrice(p.price)}</p>
              <p className="text-sm text-textLight">{p.duration} days</p>
              <Button
                className="mt-auto min-h-[48px] w-full pt-4"
                disabled={loading || !razorpayReady || buyerAccess?.hasActiveSubscription === true}
                onClick={() => pay(p)}
              >
                {buyerAccess?.hasActiveSubscription ? 'Current plan active' : 'Choose'}
              </Button>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-secondary">History</h2>
          <ul className="mt-2 space-y-2 text-sm text-textLight">
            {subs.length === 0 ? <li>No payments yet.</li> : null}
            {subs.map((s, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs">
                {JSON.stringify(s)}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-sm">
          <Link href="/explore" className="text-primary hover:underline">
            ← Back to explore
          </Link>
        </p>
      </div>
    </>
  );
}
