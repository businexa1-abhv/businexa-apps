'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/products/ProductForm';
import { useShop } from '@/hooks/useShop';
import { useNotifications } from '@/context/NotificationContext';
import * as api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ensureSellerFirebaseSession } from '@/lib/ensureSellerFirebaseSession';
import { createSellerProduct, updateSellerProduct } from '@/lib/firestoreSellerProducts';

/** Seller create/edit product — Firestore `products/{id}` + Firebase Storage images. */
export function SellerProductForm({ mode = 'create', productId }) {
  const router = useRouter();
  const { shop } = useShop();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useNotifications();
  const [product, setProduct] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');

  useEffect(() => {
    api
      .getBusinessCategories()
      .then(({ data }) => {
        const names = (data.categories || []).map((c) => c.name).filter(Boolean);
        setCategoryOptions(names);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.firebaseUid && user.role === 'seller') {
      void ensureSellerFirebaseSession(user.firebaseUid);
    }
  }, [user?.firebaseUid, user?.role]);

  useEffect(() => {
    if (mode !== 'edit' || !productId) return;
    let cancelled = false;
    setLoading(true);
    api
      .getProduct(productId)
      .then(({ data }) => {
        if (!cancelled) setProduct(data.product);
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, productId]);

  const onSubmitFirestore = async (payload) => {
    if (!shop?._id || !user?.firebaseUid) {
      showToast('Missing shop or Firebase account link.', 'error');
      return;
    }
    const sessionOk = await ensureSellerFirebaseSession(user.firebaseUid);
    if (!sessionOk) {
      showToast('Could not connect to Firebase. Check configuration.', 'error');
      return;
    }
    const priceNum = parseFloat(String(payload.price).replace(/,/g, ''));
    if (!payload.name.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      showToast('Enter a valid name and price.', 'error');
      return;
    }
    setLoading(true);
    try {
      const shopBt = String(shop.businessType || shop.category || '').trim();
      if (mode === 'edit' && productId) {
        await updateSellerProduct(productId, {
          name: payload.name,
          description: payload.description,
          price: priceNum,
          businessType: shopBt,
          category: String(payload.category || '').trim() || shopBt,
          inStock: payload.inStock,
          shopId: String(shop._id),
          sellerId: user.firebaseUid,
          imageFile: payload.imageFile,
          existingImageUrl: payload.existingImageUrl,
        });
        showToast('Saved', 'success');
        router.push(`/products/${productId}`);
      } else {
        const id = await createSellerProduct({
          name: payload.name,
          description: payload.description,
          price: priceNum,
          businessType: shopBt,
          category: String(payload.category || '').trim() || shopBt,
          shopId: String(shop._id),
          sellerId: user.firebaseUid,
          inStock: payload.inStock,
          imageFile: payload.imageFile,
          existingImageUrl: payload.existingImageUrl,
        });
        showToast('Product created', 'success');
        router.push(`/products/${id}`);
      }
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : 'Something went wrong';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'edit' && loading && !product) {
    return <p className="text-textLight">Loading…</p>;
  }

  if (mode === 'edit' && !product) {
    return <p className="text-textLight">Not found</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">{mode === 'edit' ? 'Edit product' : 'New product'}</h1>
      <ProductForm
        initial={product}
        loading={loading}
        categoryOptions={categoryOptions.length ? categoryOptions : undefined}
        defaultCategory={mode === 'create' ? shop?.businessType || shop?.category : undefined}
        onSubmitFirestore={onSubmitFirestore}
      />
    </div>
  );
}
