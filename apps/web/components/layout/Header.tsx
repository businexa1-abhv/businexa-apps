'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

function linksForRole(role: UserRole | undefined) {
  const common = [
    { href: '/account', label: 'Account' },
    { href: '/help', label: 'Help' },
  ];
  if (role === 'buyer') {
    return [{ href: '/', label: 'Explore' }, ...common];
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
  const links = linksForRole(role);
  const { logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={role === 'buyer' ? '/' : '/dashboard'} className="text-xl font-bold text-primary">
          Businexa
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition',
                pathname === l.href || (l.href !== '/' && pathname?.startsWith(l.href + '/'))
                  ? 'bg-primary/10 text-primary'
                  : 'text-text hover:bg-background'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoading}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-background disabled:opacity-50"
          >
            {isLoading ? '…' : 'Log out'}
          </button>
          <Link
            href="/settings"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-background"
          >
            Settings
          </Link>
        </div>
      </div>
    </header>
  );
}
