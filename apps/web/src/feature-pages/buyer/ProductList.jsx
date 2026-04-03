'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/products/ProductCard';
import { useBusinessCategories } from '@src/hooks/useShops';
import { useBrowseProducts } from '@src/hooks/useProducts';

/** Grid of products across shops, optional ?category= query. */
export function BuyerProductList() {
  const searchParams = useSearchParams();
  const qCategory = searchParams?.get('category') || '';
  const [selected, setSelected] = useState(qCategory);

  const { categories, loading: catLoading } = useBusinessCategories();
  const { products, loading, error, browse } = useBrowseProducts();

  useEffect(() => {
    setSelected(qCategory);
  }, [qCategory]);

  useEffect(() => {
    browse(selected, 1);
  }, [selected, browse]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Products</h1>
        <p className="mt-1 text-sm text-textLight">Browse listings from all shops. Use a category to narrow down.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary">Category</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected('')}
            className={`rounded-full border px-3 py-1.5 text-sm ${selected === '' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-background'}`}
          >
            All
          </button>
          {catLoading ? (
            <span className="text-sm text-textLight">Loading…</span>
          ) : (
            categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelected(c)}
                className={`rounded-full border px-3 py-1.5 text-sm ${selected === c ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-background'}`}
              >
                {c}
              </button>
            ))
          )}
        </div>
      </div>

      <Link href="/explore" className="text-sm text-primary hover:underline">
        ← Shops by category
      </Link>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-textLight">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 ? (
        <p className="text-sm text-textLight">No visible products for this filter.</p>
      ) : null}
    </div>
  );
}
