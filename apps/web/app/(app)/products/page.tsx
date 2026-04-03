'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { SellerProductsManager } from '@/components/products/SellerProductsManager';
import { useProducts } from '@/hooks/useProducts';
import { useShop } from '@/hooks/useShop';
import { useAuthStore } from '@/store/authStore';
import * as api from '@/lib/api';

export default function ProductsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const firebaseUid = useAuthStore((s) => s.user?.firebaseUid);
  const { shop } = useShop();
  const { products, getProducts, isLoading, totalCount, page } = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [businessCategories, setBusinessCategories] = useState<string[]>([]);

  useEffect(() => {
    if (role === 'seller') return;
    getProducts(1, 100);
  }, [getProducts, role]);

  useEffect(() => {
    if (role !== 'seller') return;
    api
      .getBusinessCategories()
      .then(({ data }) => {
        const names = (data.categories || []).map((c: { name?: string }) => c.name).filter(Boolean) as string[];
        setBusinessCategories(names.sort());
      })
      .catch(() => {});
  }, [role]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => {
      if (p.category) s.add(p.category);
    });
    return Array.from(s).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
      const matchC = !category || p.category === category;
      return matchQ && matchC;
    });
  }, [products, search, category]);

  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  if (role === 'seller') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-secondary">Products</h1>
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Add product
          </Link>
        </div>
        <ProductFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          categories={businessCategories.length ? businessCategories : categories}
        />
        <SellerProductsManager
          shopId={shop?._id ? String(shop._id) : undefined}
          firebaseUid={firebaseUid}
          title=""
          showAddButton={false}
          filterSearch={search}
          filterCategory={category}
          emptyHint="No products match your filters."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-secondary">Products</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Add product
        </Link>
      </div>
      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
      />
      {isLoading ? <p className="text-textLight">Loading…</p> : <ProductGrid products={filtered} />}
      {totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => getProducts(page - 1)}>
            Previous
          </Button>
          <span className="px-3 py-2 text-sm text-textLight">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => getProducts(page + 1)}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
