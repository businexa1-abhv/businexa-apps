'use client';

import { useEffect, useState, useCallback } from 'react';
import type { FirestoreProduct } from '@/types';
import {
  subscribeSellerProducts,
  setProductInStock,
  deleteSellerProduct,
} from '@/lib/firestoreSellerProducts';
import { ensureSellerFirebaseSession } from '@/lib/ensureSellerFirebaseSession';

export function useSellerFirestoreProductList(
  shopId: string | undefined,
  firebaseUid: string | undefined
) {
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId || !firebaseUid) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    let unsub: (() => void) | undefined;
    let cancelled = false;
    void subscribeSellerProducts(
      shopId,
      firebaseUid,
      (list) => {
        if (!cancelled) {
          setProducts(list);
          setLoading(false);
          setError(null);
        }
      },
      (msg) => {
        if (!cancelled) {
          setError(msg);
          setLoading(false);
        }
      }
    ).then((u) => {
      unsub = u;
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [shopId, firebaseUid]);

  const toggleStock = useCallback(
    async (productId: string, next: boolean) => {
      if (!firebaseUid) return;
      const ok = await ensureSellerFirebaseSession(firebaseUid);
      if (!ok) return;
      setBusyId(productId);
      try {
        await setProductInStock(productId, next);
      } finally {
        setBusyId(null);
      }
    },
    [firebaseUid]
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!firebaseUid) return;
      const ok = await ensureSellerFirebaseSession(firebaseUid);
      if (!ok) return;
      setBusyId(productId);
      try {
        await deleteSellerProduct(productId);
      } finally {
        setBusyId(null);
      }
    },
    [firebaseUid]
  );

  return { products, loading, error, busyId, toggleStock, remove };
}
