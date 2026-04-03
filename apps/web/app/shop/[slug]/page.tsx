import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopDetail } from '@src/pages/buyer/ShopDetail';
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

  return <ShopDetail slug={params.slug} initialShop={shop} initialProducts={products} />;
}
