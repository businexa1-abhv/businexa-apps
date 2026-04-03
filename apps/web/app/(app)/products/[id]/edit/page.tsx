'use client';

import { useParams } from 'next/navigation';
import { SellerProductForm } from '@src/pages/seller/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id != null ? String(params.id) : '';
  return <SellerProductForm mode="edit" productId={id} />;
}
