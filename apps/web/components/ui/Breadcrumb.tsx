import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm text-textLight', className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <span className="text-border">/</span> : null}
            {c.href ? (
              <Link href={c.href} className="hover:text-primary">
                {c.label}
              </Link>
            ) : (
              <span className="text-text">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
