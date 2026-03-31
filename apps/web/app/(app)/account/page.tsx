'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useShop } from '@/hooks/useShop';
import { useSubscription } from '@/hooks/useSubscription';
import * as api from '@/lib/api';
import { useNotifications } from '@/context/NotificationContext';
import { QRCodeBox } from '@/components/shop/QRCodeBox';

export default function AccountPage() {
  const { shop } = useShop();
  const { subscription, getActiveSubscription } = useSubscription();
  const { showToast } = useNotifications();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    api
      .getProfile()
      .then(({ data }) => {
        const u = data.user as { fullName?: string; email?: string };
        setFullName(u.fullName || '');
        setEmail(u.email || '');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (shop?._id) getActiveSubscription(shop._id);
  }, [shop?._id, getActiveSubscription]);

  const saveProfile = async () => {
    try {
      await api.updateProfile({ fullName, email });
      showToast('Profile saved', 'success');
    } catch {
      showToast('Could not save', 'error');
    }
  };

  const copyShopUrl = () => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    if (shop?.slug) {
      void navigator.clipboard.writeText(`${base}/shop/${shop.slug}`);
      showToast('Copied', 'success');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-secondary">Account</h1>

      <Card>
        <h2 className="font-semibold text-secondary">Profile</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-textLight">Full name</label>
            <Input value={fullName} onChange={setFullName} placeholder="Your name" />
          </div>
          <div>
            <label className="text-sm text-textLight">Email</label>
            <Input type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          </div>
          <Button onClick={saveProfile}>Save profile</Button>
        </div>
      </Card>

      {shop ? (
        <Card>
          <h2 className="font-semibold text-secondary">Shop</h2>
          <p className="mt-2 text-textLight">{shop.name}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyShopUrl}>
              Copy public URL
            </Button>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Dashboard
            </a>
          </div>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-semibold text-secondary">Subscription</h2>
        {subscription ? (
          <p className="mt-2 text-sm text-textLight">
            Status: {subscription.status} · Plan: {(subscription as { planType?: string }).planType || '—'}
          </p>
        ) : (
          <p className="mt-2 text-sm text-textLight">No active subscription.</p>
        )}
        <a
          href="/subscriptions"
          className="mt-4 inline-flex items-center justify-center rounded-md border-2 border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
        >
          Manage plans
        </a>
      </Card>

      {shop?.qrCodeUrl ? (
        <Card>
          <h2 className="font-semibold text-secondary">QR code</h2>
          <QRCodeBox url={shop.qrCodeUrl} />
        </Card>
      ) : null}
    </div>
  );
}
