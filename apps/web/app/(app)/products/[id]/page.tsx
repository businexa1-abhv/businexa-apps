'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
import { useNotifications } from '@/context/NotificationContext';
import { RemoteImage } from '@/components/common/RemoteImage';
import { BuyerCatalogGate } from '@/components/buyer/BuyerCatalogGate';
import { useAuthStore } from '@/store/authStore';
import * as api from '@/lib/api';

function priceOf(p: Product) {
  if (p.priceNumber != null) return p.priceNumber;
  return 0;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id != null ? String(params.id) : '';
  const role = useAuthStore((s) => s.user?.role);
  const { getProductById, deleteProduct, isLoading: sellerLoading } = useProducts();
  const { showToast } = useNotifications();
  const [product, setProduct] = useState<Product | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSellerView = role === 'seller' || role === 'admin';

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setAccessDenied(false);
    setLoading(true);
    (async () => {
      if (isSellerView) {
        const p = await getProductById(id);
        if (!cancelled) {
          setProduct(p);
          setLoading(false);
        }
        return;
      }
      try {
        const { data } = await api.getProduct(id);
        if (!cancelled) setProduct(data.product as Product);
      } catch (e: unknown) {
        const status =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { status?: number } }).response?.status
            : undefined;
        if (status === 402) {
          if (!cancelled) setAccessDenied(true);
        } else if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isSellerView, getProductById]);

  const share = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    void navigator.clipboard.writeText(url);
    showToast('Link copied', 'success');
  };

  const onDelete = async () => {
    const ok = await deleteProduct(id);
    if (ok) {
      showToast('Product deleted', 'success');
      router.push('/products');
    }
    setConfirmOpen(false);
  };

  if (accessDenied) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-secondary">Product</h1>
        <BuyerCatalogGate variant="compact" />
        <Link href="/explore/products" className="text-sm text-primary hover:underline">
          ← Browse products
        </Link>
      </div>
    );
  }

  if ((loading || (isSellerView && sellerLoading)) && !product && !accessDenied) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return <p className="text-textLight">Product not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link href={isSellerView ? '/products' : '/explore/products'}>
          <Button variant="ghost">← Back</Button>
        </Link>
        {isSellerView ? (
          <>
            <Link href={`/products/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button variant="outline" onClick={share}>
              Share
            </Button>
            <Button variant="outline" className="border-danger text-danger" onClick={() => setConfirmOpen(true)}>
              Delete
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={share}>
            Share
          </Button>
        )}
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-background">
          {product.imageUrl ? (
            <RemoteImage
              src={product.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-textLight">No image</div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold text-primary">{formatPrice(priceOf(product))}</p>
          {product.category ? <p className="mt-2 text-sm text-textLight">Category: {product.category}</p> : null}
          <p className="mt-4 whitespace-pre-wrap text-textLight">{product.description}</p>
        </div>
      </div>
      {isSellerView ? (
        <Modal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Delete product?"
          actions={[
            { label: 'Cancel', onClick: () => setConfirmOpen(false), variant: 'outline' },
            { label: 'Delete', onClick: onDelete },
          ]}
        >
          <p className="text-sm text-textLight">This cannot be undone.</p>
        </Modal>
      ) : null}
    </div>
  );
}
