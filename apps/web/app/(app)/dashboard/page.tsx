'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useShop } from '@/hooks/useShop';
import { useSubscription } from '@/hooks/useSubscription';
import * as api from '@/lib/api';
import { useNotifications } from '@/context/NotificationContext';
import { useAuthStore } from '@/store/authStore';
import type { Product } from '@/types';
import { ProductGrid } from '@/components/products/ProductGrid';
import { QRCodeBox } from '@/components/shop/QRCodeBox';

export default function DashboardPage() {
  const router = useRouter();
  const userRole = useAuthStore((s) => s.user?.role);
  const { shop, isLoading, getShop } = useShop();
  const { subscription, getActiveSubscription } = useSubscription();
  const { showToast } = useNotifications();
  const [metrics, setMetrics] = useState<{ qrScans: number; views: number; totalProducts: number } | null>(null);
  const [recent, setRecent] = useState<Product[]>([]);

  useEffect(() => {
    if (!shop?._id) return;
    if (userRole === 'seller') {
      getActiveSubscription(shop._id);
    }
    api
      .getShopMetrics(shop._id)
      .then(({ data }) => setMetrics(data.metrics))
      .catch(() => {});
    api
      .listProductsByShop(shop._id, 1, 8)
      .then(({ data }) => setRecent((data.products as Product[]) || []))
      .catch(() => {});
  }, [shop?._id, userRole, getActiveSubscription]);

  useEffect(() => {
    if (isLoading) return;
    if (userRole === 'seller' && !shop) {
      router.replace('/business-details');
    }
  }, [isLoading, shop, router, userRole]);

  if (userRole === 'buyer') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-secondary">Welcome</h1>
        <p className="text-textLight">
          You are signed in as a <strong>buyer</strong>. Discover shops and products from the home page, or open your
          account.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Explore home
          </Link>
          <Link href="/account" className="inline-flex rounded-md border border-border px-4 py-2 text-sm hover:bg-background">
            Account
          </Link>
        </div>
      </div>
    );
  }

  if (userRole === 'admin' && !shop) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-secondary">Admin</h1>
        <p className="text-textLight">
          You do not have a shop linked. Use the admin area to manage users, shops, and catalog-wide product oversight.
        </p>
        <Link
          href="/admin"
          className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Open admin panel
        </Link>
      </div>
    );
  }

  const activeSub =
    userRole === 'seller' && Boolean(subscription && subscription.status === 'active');

  const copyUrl = () => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    if (shop?.slug) {
      void navigator.clipboard.writeText(`${base}/shop/${shop.slug}`);
      showToast('Shop link copied', 'success');
    }
  };

  if (isLoading || !shop) {
    return <p className="text-textLight">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
          <p className="text-textLight">{shop.name}</p>
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

      {userRole === 'seller' && !activeSub ? (
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
          <h2 className="mb-4 text-lg font-semibold text-secondary">Recent products</h2>
          <ProductGrid products={recent} />
          <Link href="/products" className="mt-4 inline-block text-sm text-primary hover:underline">
            View all products →
          </Link>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-secondary">QR code</h2>
          <QRCodeBox url={shop.qrCodeUrl || ''} />
          <Button
            className="mt-4"
            variant="secondary"
            onClick={async () => {
              try {
                await api.generateShopQr(shop._id);
                await getShop();
                showToast('QR updated', 'success');
              } catch (e: unknown) {
                const msg =
                  e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
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
