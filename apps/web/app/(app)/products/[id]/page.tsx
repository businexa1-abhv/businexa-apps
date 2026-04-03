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

function priceOf(p: Product) {
  if (p.priceNumber != null) return p.priceNumber;
  return 0;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id != null ? String(params.id) : '';
  const { getProductById, deleteProduct, isLoading } = useProducts();
  const { showToast } = useNotifications();
  const [product, setProduct] = useState<Product | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    void getProductById(id).then(setProduct);
  }, [id, getProductById]);

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

  if (isLoading && !product) {
    return <p className="text-textLight">Loading…</p>;
  }

  if (!product) {
    return <p className="text-textLight">Product not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link href="/products">
          <Button variant="ghost">← Back</Button>
        </Link>
        <Link href={`/products/${id}/edit`}>
          <Button variant="secondary">Edit</Button>
        </Link>
        <Button variant="outline" onClick={share}>
          Share
        </Button>
        <Button variant="outline" className="border-danger text-danger" onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
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
          <h1 className="text-3xl font-bold text-secondary">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold text-primary">{formatPrice(priceOf(product))}</p>
          {product.category ? <p className="mt-2 text-sm text-textLight">Category: {product.category}</p> : null}
          <p className="mt-4 text-textLight whitespace-pre-wrap">{product.description}</p>
        </div>
      </div>
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
    </div>
  );
}
