'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useShop } from '@/hooks/useShop';
import { SellerDashboard } from '@src/pages/seller/Dashboard';

export default function DashboardPage() {
  const userRole = useAuthStore((s) => s.user?.role);
  const { shop, isLoading } = useShop();

  if (userRole === 'buyer') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Welcome</h1>
          <p className="mt-1 text-textLight">
            You are signed in as a <strong>buyer</strong>. Open a shop from a QR code or browse the full directory.
          </p>
        </div>

        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-background p-6 shadow-sm">
          <p className="text-sm font-medium text-secondary">Have a shop QR?</p>
          <p className="mt-1 text-sm text-textLight">Scan to open that shop&apos;s page.</p>
          <Link
            href="/scan"
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary px-6 py-4 text-base font-semibold text-white shadow-md transition hover:opacity-95 sm:inline-flex sm:w-auto sm:min-w-[220px]"
          >
            Scan QR
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="inline-flex rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-background"
          >
            All shops by category
          </Link>
          <Link
            href="/explore/products"
            className="inline-flex rounded-md border border-border px-4 py-2 text-sm hover:bg-background"
          >
            All products
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

  if (userRole === 'seller' || userRole === 'admin') {
    return <SellerDashboard />;
  }

  if (isLoading) {
    return <p className="text-textLight">Loading…</p>;
  }

  return <p className="text-textLight">Nothing to show.</p>;
}
