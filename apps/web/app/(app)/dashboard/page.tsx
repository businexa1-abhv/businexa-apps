'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useShop } from '@/hooks/useShop';
import { SellerDashboard } from '@src/pages/seller/Dashboard';

export default function DashboardPage() {
  const userRole = useAuthStore((s) => s.user?.role);
  const buyerAccess = useAuthStore((s) => s.user?.buyerAccess);
  const { shop, isLoading } = useShop();

  if (userRole === 'buyer') {
    const canPlus = !buyerAccess || buyerAccess.canAccessPremium === true;
    const scanHref = canPlus ? '/scan' : '/membership';
    const scanLabel = canPlus ? 'Scan QR' : 'Unlock QR — Plus';

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Welcome</h1>
          <p className="mt-1 text-textLight">
            You are signed in as a <strong>buyer</strong>. Browse shops, discover products, and use QR when you&apos;re
            on Plus (or your free first day).
          </p>
        </div>

        {buyerAccess && !buyerAccess.canAccessPremium ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-secondary shadow-sm dark:border-amber-800/50 dark:bg-amber-950/30">
            <p className="font-semibold">Plus required</p>
            <p className="mt-1 text-sm text-textLight">
              Subscribe to keep full access after your free day — shops, products, and QR scan.
            </p>
            <Link
              href="/membership"
              className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              View Businexa Plus
            </Link>
          </div>
        ) : buyerAccess?.inTrial && !buyerAccess?.hasActiveSubscription ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-sm text-secondary">
            <span className="font-semibold">Free access active</span> — your first day includes everything. Add Plus
            anytime so nothing stops when the trial window ends.
            <Link href="/membership" className="ml-1 font-medium text-primary underline">
              See plans
            </Link>
          </div>
        ) : null}

        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-background p-6 shadow-sm">
          <p className="text-sm font-medium text-secondary">Have a shop QR?</p>
          <p className="mt-1 text-sm text-textLight">Scan to open that shop&apos;s page.</p>
          <Link
            href={scanHref}
            className="mt-4 flex w-full min-h-[52px] items-center justify-center rounded-xl bg-primary px-6 py-4 text-base font-semibold text-white shadow-md transition hover:opacity-95 sm:inline-flex sm:w-auto sm:min-w-[220px]"
          >
            {scanLabel}
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
