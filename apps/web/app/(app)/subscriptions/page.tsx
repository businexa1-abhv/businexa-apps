'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useShop } from '@/hooks/useShop';
import { useSubscription } from '@/hooks/useSubscription';
import * as api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import type { SubscriptionPlan } from '@/types';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export default function SubscriptionsPage() {
  const { shop } = useShop();
  const { plans, subscription, getActiveSubscription, createOrder, verifyPayment, isLoading } = useSubscription();
  const { showToast } = useNotifications();
  const [subs, setSubs] = useState<unknown[]>([]);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    if (shop?._id) getActiveSubscription(shop._id);
  }, [shop?._id, getActiveSubscription]);

  useEffect(() => {
    api
      .listSubscriptions()
      .then(({ data }) => setSubs((data.subscriptions as unknown[]) || []))
      .catch(() => {});
  }, []);

  const pay = async (plan: SubscriptionPlan) => {
    if (!shop?._id) {
      showToast('Create a shop first', 'error');
      return;
    }
    if (!window.Razorpay) {
      showToast('Payment script loading', 'error');
      return;
    }
    try {
      const order = await createOrder(plan.id, shop._id);
      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Businexa',
        description: plan.name,
        order_id: order.orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              shopId: shop._id,
              planId: plan.id,
            });
            showToast('Payment successful', 'success');
            await getActiveSubscription(shop._id);
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
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRazorpayReady(true)} />
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-secondary">Plans & billing</h1>
        {subscription ? (
          <p className="text-sm text-textLight">
            Current: {subscription.status} · {(subscription as { planType?: string }).planType}
          </p>
        ) : (
          <p className="text-sm text-textLight">No active subscription for this shop.</p>
        )}
        {!razorpayReady ? <p className="text-sm text-textLight">Loading payment…</p> : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <Card key={p.id}>
              <h2 className="font-semibold text-secondary">{p.name}</h2>
              <p className="mt-2 text-2xl font-bold text-primary">{formatPrice(p.price)}</p>
              <p className="text-sm text-textLight">{p.duration} days</p>
              <Button className="mt-4 w-full" disabled={isLoading || !shop} onClick={() => pay(p)}>
                Choose
              </Button>
            </Card>
          ))}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-secondary">Payment history</h2>
          <ul className="mt-2 space-y-2 text-sm text-textLight">
            {subs.length === 0 ? <li>No records yet.</li> : null}
            {subs.map((s, i) => (
              <li key={i}>{JSON.stringify(s)}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
