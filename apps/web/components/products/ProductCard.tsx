'use client';

import Link from 'next/link';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

function priceOf(p: Product) {
  if (p.priceNumber != null) return p.priceNumber;
  if (p.price != null && typeof p.price === 'object' && '$numberDecimal' in (p.price as object)) {
    return parseFloat(String((p.price as { $numberDecimal: string }).$numberDecimal));
  }
  return 0;
}

export function ProductCard({ product }: { product: Product }) {
  const price = priceOf(product);
  return (
    <Card clickable padding="sm" className="overflow-hidden">
      <Link href={`/products/${product._id}`} className="block">
        <div className="relative aspect-square w-full bg-background">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-textLight text-sm">No image</div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-secondary line-clamp-2">{product.name}</h3>
          <p className="mt-1 text-primary font-medium">{formatPrice(price)}</p>
        </div>
      </Link>
    </Card>
  );
}
