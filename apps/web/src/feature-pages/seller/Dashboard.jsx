'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useShop } from '@/hooks/useShop';
import { useSubscription } from '@/hooks/useSubscription';
import * as api from '@/lib/api';
import { useNotifications } from '@/context/NotificationContext';
import { SellerProductsManager } from '@/components/products/SellerProductsManager';
import { QRCodeBox } from '@/components/shop/QRCodeBox';
import { QRGenerator } from '@src/components/QRGenerator';
import { useAuthStore } from '@/store/authStore';

/** Seller home: metrics, recent products, QR (PNG from API + vector preview via qrcode.react). */
export function SellerDashboard() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const businessType = useAuthStore((s) => s.user?.businessType);
  const { shop, isLoading, getShop } = useShop();

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);
  const { subscription, getActiveSubscription } = useSubscription();
  const { showToast } = useNotifications();
  const [metrics, setMetrics] = useState(null);
  const firebaseUid = useAuthStore((s) => s.user?.firebaseUid);

  useEffect(() => {
    if (!shop?._id) return;
    getActiveSubscription(shop._id);
    api
      .getShopMetrics(shop._id)
      .then(({ data }) => setMetrics(data.metrics))
      .catch(() => {});
  }, [shop?._id, getActiveSubscription]);

  useEffect(() => {
    if (isLoading) return;
    if (!shop) {
      router.replace('/business-details');
    }
  }, [isLoading, shop, router]);

  if (isLoading || !shop) {
    return <p className="text-textLight">Loading…</p>;
  }

  const activeSub = Boolean(subscription && subscription.status === 'active');
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const shopUrl = shop.slug ? `${base}/shop/${shop.slug}` : '';

  const copyUrl = () => {
    if (shop.slug) {
      void navigator.clipboard.writeText(`${base}/shop/${shop.slug}`);
      showToast('Shop link copied', 'success');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-textLight">{shop.name}</p>
            {(businessType || shop.category) ? (
              <span
                className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                title="Business type"
              >
                {businessType || shop.category}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add product
          </Link>
          <Button variant="outline" onClick={copyUrl}>
            Copy shop URL
          </Button>
        </div>
      </div>

      {!activeSub ? (
        <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-secondary">
          No active subscription — QR and premium features require a plan.{' '}
          <Link href="/subscriptions" className="font-medium text-primary underline">
            View plans
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-textLight">QR scans</p>
          <p className="text-2xl font-semibold text-secondary">{metrics?.qrScans ?? shop.metrics?.qrScans ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-textLight">Views</p>
          <p className="text-2xl font-semibold text-secondary">{metrics?.views ?? shop.metrics?.views ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-textLight">Products</p>
          <p className="text-2xl font-semibold text-secondary">{metrics?.totalProducts ?? shop.metrics?.totalProducts ?? 0}</p>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <SellerProductsManager
            shopId={shop._id ? String(shop._id) : undefined}
            firebaseUid={firebaseUid}
            title="Your products"
            showViewAllLink
            emptyHint="No products yet — add one to get started."
          />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-secondary">QR code</h2>
          <div className="flex flex-wrap items-start gap-6">
            <QRCodeBox url={shop.qrCodeUrl || ''} />
            {shopUrl ? (
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="mb-2 text-sm font-medium text-secondary">Vector preview</p>
                <QRGenerator value={shopUrl} size={160} />
              </div>
            ) : null}
          </div>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={async () => {
              try {
                await api.generateShopQr(shop._id);
                await getShop();
                showToast('QR updated', 'success');
              } catch (e) {
                const msg =
                  typeof e === 'object' && e !== null && 'response' in e && e.response?.data?.message
                    ? String(e.response.data.message)
                    : 'Could not generate QR';
                showToast(msg || 'Error', 'error');
              }
            }}
          >
            Generate / refresh QR
          </Button>
        </div>
      </div>
    </div>
  );
}
