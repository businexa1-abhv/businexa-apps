'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

function linksForRole(
  role: UserRole | undefined,
  opts: { buyerCanScan?: boolean } = {}
) {
  const common = [
    { href: '/account', label: 'Account' },
    { href: '/help', label: 'Help' },
  ];
  if (role === 'buyer') {
    const canScan = opts.buyerCanScan === true;
    return [
      { href: '/explore', label: 'Explore' },
      { href: '/explore/products', label: 'Products' },
      ...(canScan ? [{ href: '/scan', label: 'Scan' }] : []),
      { href: '/membership', label: canScan ? 'Plus' : 'Unlock Plus' },
      ...common,
    ];
  }
  if (role === 'admin') {
    return [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/products', label: 'Products' },
      { href: '/admin', label: 'Admin' },
      ...common,
    ];
  }
  /** Sellers: shop plans & billing — not shown for buyers or admins */
  return [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/products', label: 'Products' },
    { href: '/subscriptions', label: 'Plans' },
    ...common,
  ];
}

export function Header() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const buyerAccess = useAuthStore((s) => s.user?.buyerAccess);
  /** Until `buyerAccess` is loaded, keep Scan visible to avoid a harsh flash for new sessions. */
  const buyerCanScan =
    role !== 'buyer' || !buyerAccess || buyerAccess.canAccessPremium === true;
  const links = linksForRole(role, { buyerCanScan });
  const { logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
        <Link href="/dashboard" className="min-h-[44px] min-w-[44px] text-xl font-bold leading-[44px] text-primary">
          Businexa
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className={cn(
                'rounded-lg px-2.5 py-2 text-sm font-medium transition sm:px-3',
                pathname === l.href || (l.href !== '/' && pathname?.startsWith(l.href + '/'))
                  ? 'bg-primary/10 text-primary'
                  : 'text-text hover:bg-background'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Open menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span className="text-lg leading-none">{mobileOpen ? '✕' : '☰'}</span>
        </button>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoading}
            className="min-h-[40px] rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-background disabled:opacity-50"
          >
            {isLoading ? '…' : 'Log out'}
          </button>
          <Link
            href="/settings"
            className="inline-flex min-h-[40px] items-center rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-background"
          >
            Settings
          </Link>
        </div>
      </div>
      {mobileOpen ? (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile main">
            {links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'min-h-[48px] rounded-xl px-3 py-3 text-base font-medium',
                  pathname === l.href || (l.href !== '/' && pathname?.startsWith(l.href + '/'))
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary'
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className="min-h-[48px] rounded-xl px-3 py-3 text-base text-text"
            >
              Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                void logout();
              }}
              className="min-h-[48px] rounded-xl px-3 py-3 text-left text-base text-text"
            >
              Log out
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
