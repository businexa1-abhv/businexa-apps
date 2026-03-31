'use client';

import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/products/ProductForm';
import { useProducts } from '@/hooks/useProducts';
import { useNotifications } from '@/context/NotificationContext';

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct, isLoading } = useProducts();
  const { showToast } = useNotifications();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">New product</h1>
      <ProductForm
        loading={isLoading}
        onSubmit={async (form) => {
          const p = await createProduct(form);
          if (p) {
            showToast('Product created', 'success');
            router.push(`/products/${p._id}`);
          }
        }}
      />
    </div>
  );
}
