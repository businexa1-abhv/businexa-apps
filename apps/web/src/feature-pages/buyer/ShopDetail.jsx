'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import * as api from '@/lib/api';
import { ShopHeader } from '@/components/shop/ShopHeader';
import { ProductList } from '@/components/shop/ProductList';

/** Single shop + products (client). Prefer passing SSR `initialShop` / `initialProducts` when available. */
export function ShopDetail({ slug, initialShop, initialProducts }) {
  const [shop, setShop] = useState(initialShop ?? null);
  const [products, setProducts] = useState(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialShop);

  useEffect(() => {
    if (initialShop != null && initialProducts != null) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.getPublicShop(slug);
        if (cancelled) return;
        const sh = data.shop;
        setShop(sh);
        if (sh?._id) {
          const pr = await api.listProductsByShop(String(sh._id), 1, 100);
          if (!cancelled) setProducts(pr.data.products || []);
        }
      } catch {
        if (!cancelled) setShop(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, initialShop, initialProducts]);

  if (loading && !shop) {
    return <p className="text-textLight">Loading…</p>;
  }

  if (!shop) {
    return (
      <div className="py-12 text-center">
        <p className="text-secondary">Shop not found</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Home
        </Link>
      </div>
    );
  }

  const wa = shop.whatsappNumber ? `https://wa.me/91${String(shop.whatsappNumber).replace(/\D/g, '')}` : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <ShopHeader shop={shop} />
        {wa ? (
          <div className="mt-6 flex justify-center">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Chat on WhatsApp
            </a>
          </div>
        ) : null}
        <section className="mt-12">
          <h2 className="mb-6 text-lg font-semibold text-secondary">Products</h2>
          <ProductList
            products={(products || []).filter((p) => p.isVisible !== false && p.inStock !== false)}
          />
        </section>
      </div>
    </div>
  );
}
