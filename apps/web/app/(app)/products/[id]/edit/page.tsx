'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductForm } from '@/components/products/ProductForm';
import { useProducts } from '@/hooks/useProducts';
import { useNotifications } from '@/context/NotificationContext';
import type { Product } from '@/types';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { getProductById, updateProduct, isLoading } = useProducts();
  const { showToast } = useNotifications();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    void getProductById(id).then(setProduct);
  }, [id, getProductById]);

  if (!product) {
    return <p className="text-textLight">{isLoading ? 'Loading…' : 'Not found'}</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">Edit product</h1>
      <ProductForm
        initial={product}
        loading={isLoading}
        onSubmit={async (form) => {
          const p = await updateProduct(id, form);
          if (p) {
            showToast('Saved', 'success');
            router.push(`/products/${id}`);
          }
        }}
      />
    </div>
  );
}
