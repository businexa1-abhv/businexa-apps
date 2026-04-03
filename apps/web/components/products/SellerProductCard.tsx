'use client';

import Link from 'next/link';
import type { FirestoreProduct } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { RemoteImage } from '@/components/common/RemoteImage';

function priceOf(p: FirestoreProduct) {
  if (p.priceNumber != null) return p.priceNumber;
  return typeof p.price === 'number' ? p.price : 0;
}

export function SellerProductCard({
  product,
  onEdit,
  onDelete,
  onToggleStock,
  busyId,
}: {
  product: FirestoreProduct;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStock: (next: boolean) => void;
  busyId?: string | null;
}) {
  const price = priceOf(product);
  const busy = busyId === product._id;

  return (
    <Card padding="sm" className="relative overflow-hidden">
      <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-md bg-white/90 p-0.5 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1.5 text-secondary hover:bg-background"
          title="Edit"
          aria-label="Edit product"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1.5 text-danger hover:bg-background"
          title="Delete"
          aria-label="Delete product"
        >
          🗑️
        </button>
      </div>
      <Link href={`/products/${product._id}`} className="block">
        <div className="relative aspect-square w-full bg-background">
          {product.imageUrl ? (
            <RemoteImage
              src={product.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-textLight text-sm">No image</div>
          )}
        </div>
        <div className="p-3">
          <h3 className="pr-14 font-semibold text-secondary line-clamp-2">{product.name}</h3>
          <p className="mt-1 font-medium text-primary">{formatPrice(price)}</p>
          {product.category ? (
            <p className="mt-1 text-xs text-textLight line-clamp-1">{product.category}</p>
          ) : null}
        </div>
      </Link>
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="text-xs font-medium text-secondary">In stock</span>
        <button
          type="button"
          role="switch"
          aria-checked={product.inStock}
          disabled={busy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleStock(!product.inStock);
          }}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            product.inStock ? 'bg-primary' : 'bg-border'
          } ${busy ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              product.inStock ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </Card>
  );
}
