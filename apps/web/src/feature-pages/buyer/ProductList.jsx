'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/products/ProductCard';
import { BuyerCatalogGate } from '@/components/buyer/BuyerCatalogGate';
import { useBusinessCategories } from '@src/hooks/useShops';
import { useBrowseProducts } from '@src/hooks/useProducts';

/** Grid of products across shops, optional ?category= query. */
export function BuyerProductList() {
  const searchParams = useSearchParams();
  const qCategory = searchParams?.get('category') || '';
  const [selected, setSelected] = useState(qCategory);
  const [searchQ, setSearchQ] = useState('');

  const { categories, loading: catLoading } = useBusinessCategories();
  const { products, loading, error, browse, buyerPreview } = useBrowseProducts();

  useEffect(() => {
    setSelected(qCategory);
  }, [qCategory]);

  useEffect(() => {
    browse(selected, 1, searchQ);
  }, [selected, searchQ, browse]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Products</h1>
        <p className="mt-1 text-sm text-textLight">
          Search by name and filter by business type (shop vertical) at the same time.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-secondary" htmlFor="product-search">
          Search products
        </label>
        <input
          id="product-search"
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search by product name…"
          className="w-full max-w-md rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary">Business type</p>
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
        ← Shops by business type
      </Link>

      {buyerPreview ? (
        <div className="mt-6">
          <BuyerCatalogGate variant="products" />
        </div>
      ) : null}

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

      {!loading && products.length === 0 && !buyerPreview ? (
        <p className="text-sm text-textLight">No visible products for this filter.</p>
      ) : null}
    </div>
  );
}
