'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/products', label: 'Products' },
  { href: '/subscriptions', label: 'Plans' },
  { href: '/account', label: 'Account' },
  { href: '/help', label: 'Help' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          Businexa
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition',
                pathname === l.href || pathname?.startsWith(l.href + '/')
                  ? 'bg-primary/10 text-primary'
                  : 'text-text hover:bg-background'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/settings"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-background"
        >
          Settings
        </Link>
      </div>
    </header>
  );
}
