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

function getApiErrorMessage(e) {
  if (!e || typeof e !== 'object') return 'Something went wrong';
  const r = e.response;
  const d = r && r.data;
  if (d && typeof d.message === 'string') return d.message;
  if (e.message) return String(e.message);
  return 'Something went wrong';
}

/** Seller create/edit — Firestore when `firebaseUid` is set; otherwise REST/Mongo (same as seed users). */
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

  const onSubmitMongo = async (form) => {
    if (!shop?._id) {
      showToast('Create a shop first.', 'error');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'edit' && productId) {
        await api.updateProductForm(productId, form);
        showToast('Saved', 'success');
        router.push(`/products/${productId}`);
      } else {
        const { data } = await api.createProductForm(form);
        const id = data?.product?._id;
        if (!id) throw new Error('Invalid response');
        showToast('Product created', 'success');
        router.push(`/products/${id}`);
      }
    } catch (e) {
      showToast(getApiErrorMessage(e), 'error');
    } finally {
      setLoading(false);
    }
  };

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

  /** Firestore CRUD only for docs owned by this seller; Mongo/seed products use REST. */
  const productIsFirestore =
    mode === 'edit' &&
    product &&
    user?.firebaseUid &&
    String(product.sellerId || '') === String(user.firebaseUid);
  const useFirestorePath = Boolean(user?.firebaseUid) && (mode === 'create' || productIsFirestore);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">{mode === 'edit' ? 'Edit product' : 'New product'}</h1>
      <ProductForm
        initial={product}
        loading={loading}
        categoryOptions={categoryOptions.length ? categoryOptions : undefined}
        defaultCategory={mode === 'create' ? shop?.businessType || shop?.category : undefined}
        onSubmit={useFirestorePath ? undefined : onSubmitMongo}
        onSubmitFirestore={useFirestorePath ? onSubmitFirestore : undefined}
      />
    </div>
  );
}
