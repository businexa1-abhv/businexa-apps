'use client';

import Link from 'next/link';

/**
 * Shown when API returns `buyerCatalog.preview` (guest or buyer without trial/subscription).
 */
export function BuyerCatalogGate({
  variant = 'shop',
  showSignInFirst = false,
}: {
  variant?: 'shop' | 'products' | 'compact';
  /** When true (not logged in), primary CTA goes to home / sign-in. */
  showSignInFirst?: boolean;
}) {
  const shell =
    variant === 'compact'
      ? 'rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5 shadow-sm'
      : 'rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.12] to-background p-6 sm:p-8 shadow-lg';

  return (
    <div className={shell}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Businexa Plus</p>
          <h2 className="text-xl font-bold text-secondary sm:text-2xl">
            {variant === 'products' ? 'Unlock the product catalog' : 'Unlock this shop & QR tools'}
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-textLight">
            New buyers get <strong className="text-secondary">one free day</strong> of full access after signup. After
            that, subscribe to keep browsing shops, viewing products, and using QR scan — all in one place.
          </p>
        </div>
        <Link
          href={showSignInFirst ? '/' : '/membership'}
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-2xl bg-primary px-6 py-3 text-center text-base font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.99]"
        >
          {showSignInFirst ? 'Sign in or join' : 'View plans'}
        </Link>
      </div>
      <p className="mt-4 text-center text-xs text-textLight sm:text-left">
        Already on Plus?{' '}
        <button type="button" className="font-medium text-primary underline" onClick={() => window.location.reload()}>
          Refresh
        </button>{' '}
        after payment.
      </p>
    </div>
  );
}
