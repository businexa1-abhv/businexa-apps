'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import * as api from '@/lib/api';
import { ShopHeader } from '@/components/shop/ShopHeader';
import { ProductList } from '@/components/shop/ProductList';
import { BuyerCatalogGate } from '@/components/buyer/BuyerCatalogGate';
import { useAuthStore } from '@/store/authStore';

/** Single shop + products — client fetch (sends JWT) so buyer Plus / trial applies. */
export function ShopDetail({ slug, initialShop, initialProducts }) {
  const authed = Boolean(useAuthStore((s) => s.user));
  const [shop, setShop] = useState(initialShop ?? null);
  const [products, setProducts] = useState(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialShop);
  const [buyerPreview, setBuyerPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.getPublicShop(slug);
        if (cancelled) return;
        const sh = data.shop;
        setShop(sh);
        setBuyerPreview(Boolean(data.buyerCatalog?.preview));
        if (sh?._id) {
          const pr = await api.listProductsByShop(String(sh._id), 1, 100);
          if (cancelled) return;
          if (pr.data.buyerCatalog?.preview) setBuyerPreview(true);
          setProducts(pr.data.products || []);
        } else {
          setProducts([]);
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
  }, [slug]);

  if (loading && !shop) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-textLight">Loading shop…</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="py-12 text-center">
        <p className="text-secondary">Shop not found</p>
        <Link href="/" className="mt-4 inline-block min-h-[44px] text-primary hover:underline">
          Home
        </Link>
      </div>
    );
  }

  const wa = shop.whatsappNumber ? `https://wa.me/91${String(shop.whatsappNumber).replace(/\D/g, '')}` : null;
  const showBuyerGate = buyerPreview;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-10">
        <ShopHeader shop={shop} />
        {showBuyerGate ? (
          <div className="mt-8">
            <BuyerCatalogGate variant="shop" showSignInFirst={!authed} />
          </div>
        ) : null}
        {!showBuyerGate && wa ? (
          <div className="mt-6 flex justify-center">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-full bg-[#25D366] px-6 py-3.5 text-base font-semibold text-white shadow-md hover:opacity-95 sm:w-auto"
            >
              Chat on WhatsApp
            </a>
          </div>
        ) : null}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-secondary">Products</h2>
          {showBuyerGate ? (
            <p className="text-sm text-textLight">Products are hidden until you unlock Businexa Plus.</p>
          ) : (
            <ProductList
              products={(products || []).filter((p) => p.isVisible !== false && p.inStock !== false)}
            />
          )}
        </section>
      </div>
    </div>
  );
}
