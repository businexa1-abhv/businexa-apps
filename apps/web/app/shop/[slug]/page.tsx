import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopHeader } from '@/components/shop/ShopHeader';
import { ProductList } from '@/components/shop/ProductList';
import type { Product, Shop } from '@/types';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function loadShop(slug: string): Promise<Shop | null> {
  try {
    const res = await fetch(`${apiBase}/shops/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.shop as Shop;
  } catch {
    return null;
  }
}

async function loadProducts(shopId: string): Promise<Product[]> {
  try {
    const res = await fetch(`${apiBase}/products?shopId=${encodeURIComponent(shopId)}&page=1&limit=100`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products as Product[]) || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const shop = await loadShop(params.slug);
  if (!shop) {
    return { title: 'Shop' };
  }
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    title: shop.name,
    description: shop.description || `${shop.name} on Businexa`,
    openGraph: {
      title: shop.name,
      description: shop.description || 'Browse products',
      url: `${url}/shop/${shop.slug}`,
    },
    alternates: { canonical: `${url}/shop/${shop.slug}` },
  };
}

export default async function PublicShopPage({ params }: { params: { slug: string } }) {
  const shop = await loadShop(params.slug);
  if (!shop) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-secondary">Shop not found</h1>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Home
        </Link>
      </div>
    );
  }

  const products = await loadProducts(String(shop._id));
  const wa = shop.whatsappNumber ? `https://wa.me/91${shop.whatsappNumber.replace(/\D/g, '')}` : null;

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
          <ProductList products={products.filter((p) => p.isVisible !== false)} />
        </section>
      </div>
    </div>
  );
}
