'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { categoryChipEmoji } from '@/lib/businessCategoryUi';
import { useBusinessCategories, useShops } from '@src/hooks/useShops';

function slugifyCategory(name) {
  return String(name || 'other')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Buyer explore: horizontal category chips (filter) or "All" grouped directory.
 */
export function BuyerHome() {
  const { categories, loading: catLoading } = useBusinessCategories();
  const { shops, total, loading, error, browseShops } = useShops();
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    browseShops(filterCategory, 1, 100);
  }, [filterCategory, browseShops]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of shops) {
      const key = (s.category && String(s.category).trim()) || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    const keys = [...map.keys()];
    keys.sort((a, b) => {
      const ia = categories.indexOf(a);
      const ib = categories.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
    return keys.map((k) => ({ category: k, shops: map.get(k) || [] }));
  }, [shops, categories]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-background p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-secondary">Explore shops</h1>
        <p className="mt-1 text-sm text-textLight">Pick a category or scan a shop QR to open it directly.</p>
        <Link
          href="/scan"
          className="mt-5 flex w-full items-center justify-center rounded-xl bg-primary px-6 py-4 text-base font-semibold text-white shadow-md transition hover:opacity-95 sm:w-auto sm:min-w-[220px]"
        >
          Scan QR
        </Link>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary">Categories</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
          <button
            type="button"
            onClick={() => setFilterCategory('')}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              filterCategory === ''
                ? 'border-primary bg-primary/15 text-primary shadow-sm'
                : 'border-border bg-surface hover:bg-background'
            }`}
          >
            <span aria-hidden>🌐</span>
            All
          </button>
          {catLoading ? (
            <span className="shrink-0 self-center text-sm text-textLight">Loading…</span>
          ) : (
            categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilterCategory(c)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  filterCategory === c
                    ? 'border-primary bg-primary/15 text-primary shadow-sm'
                    : 'border-border bg-surface hover:bg-background'
                }`}
              >
                <span aria-hidden className="text-base leading-none">
                  {categoryChipEmoji(c)}
                </span>
                {c}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-textLight">
        <span>
          {loading ? 'Loading shops…' : total ? `${total} shop(s) total` : 'No shops yet'}
          {!filterCategory && total > 100 ? ` — showing ${shops.length} in directory` : null}
        </span>
        <Link href="/explore/products" className="font-medium text-primary hover:underline">
          Browse all products →
        </Link>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-textLight">Loading…</p>
      ) : filterCategory ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((s) => (
            <li key={s._id}>
              <Link
                href={`/shop/${s.slug || s._id}`}
                className="block rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/40"
              >
                <p className="font-semibold text-secondary">{s.name}</p>
                {s.category ? <p className="mt-1 text-xs text-primary">{s.category}</p> : null}
                {s.description ? <p className="mt-2 line-clamp-2 text-sm text-textLight">{s.description}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ category, shops: list }) => (
            <section key={category} id={`category-${slugifyCategory(category)}`}>
              <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-secondary">
                <span aria-hidden>{categoryChipEmoji(category)}</span>
                {category}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <li key={s._id}>
                    <Link
                      href={`/shop/${s.slug || s._id}`}
                      className="block rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/40"
                    >
                      <p className="font-semibold text-secondary">{s.name}</p>
                      {s.description ? <p className="mt-2 line-clamp-2 text-sm text-textLight">{s.description}</p> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {!loading && shops.length === 0 ? (
        <p className="text-sm text-textLight">No shops match this view yet.</p>
      ) : null}

      {!loading && !filterCategory && total > 100 ? (
        <p className="text-xs text-textLight">
          Directory lists the first 100 shops (by name). Full totals may be higher.
        </p>
      ) : null}
    </div>
  );
}
