'use client';

import type { Unsubscribe } from 'firebase/firestore';
import { getFirebase } from './firebaseClient';
import type { FirestoreProduct } from '@/types';

function collectionRef() {
  return import('firebase/firestore').then((m) => m);
}

export async function subscribeSellerProducts(
  shopId: string,
  sellerId: string,
  onUpdate: (products: FirestoreProduct[]) => void,
  onError?: (msg: string) => void
): Promise<Unsubscribe> {
  const f = await getFirebase();
  if (!f) {
    onError?.('Firebase is not configured');
    return () => {};
  }
  const { collection, query, where, orderBy, onSnapshot } = await collectionRef();
  const q = query(
    collection(f.db, 'products'),
    where('shopId', '==', shopId),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: FirestoreProduct[] = snap.docs.map((d) => docToProduct(d.id, d.data()));
      onUpdate(list);
    },
    (err) => onError?.(err.message)
  );
}

function docToProduct(id: string, data: Record<string, unknown>): FirestoreProduct {
  const priceRaw = data.price;
  const price =
    typeof priceRaw === 'number'
      ? priceRaw
      : typeof priceRaw === 'string'
        ? parseFloat(priceRaw)
        : 0;
  const ts = data.createdAt as { toDate?: () => Date } | undefined;
  const sellerId = String(data.sellerId ?? '');
  return {
    id,
    _id: id,
    ownerId: sellerId,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    price: Number.isFinite(price) ? price : 0,
    priceNumber: Number.isFinite(price) ? price : 0,
    imageUrl: String(data.imageUrl ?? ''),
    category: String(data.category ?? ''),
    shopId: String(data.shopId ?? ''),
    sellerId,
    inStock: data.inStock !== false,
    createdAt: ts && typeof ts.toDate === 'function' ? ts.toDate().toISOString() : undefined,
  };
}

async function uploadProductImage(shopId: string, productId: string, file: File): Promise<string> {
  const f = await getFirebase();
  if (!f) throw new Error('Firebase not configured');
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const safeName = file.name.replace(/[^\w.\-]/g, '_') || 'image';
  const path = `products/${shopId}/${productId}/${Date.now()}-${safeName}`;
  const r = ref(f.storage, path);
  await uploadBytes(r, file, { contentType: file.type || 'image/jpeg' });
  return getDownloadURL(r);
}

export type SellerProductInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  shopId: string;
  sellerId: string;
  inStock: boolean;
};

export async function createSellerProduct(
  input: Omit<SellerProductInput, 'imageUrl'> & { imageFile: File | null; existingImageUrl?: string }
): Promise<string> {
  const f = await getFirebase();
  if (!f) throw new Error('Firebase not configured');
  const { collection, doc, setDoc, serverTimestamp } = await collectionRef();
  const newRef = doc(collection(f.db, 'products'));
  const productId = newRef.id;

  let imageUrl = input.existingImageUrl?.trim() || '';
  if (input.imageFile) {
    imageUrl = await uploadProductImage(input.shopId, productId, input.imageFile);
  }

  await setDoc(newRef, {
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    imageUrl,
    category: input.category.trim(),
    shopId: input.shopId,
    sellerId: input.sellerId,
    inStock: input.inStock,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return productId;
}

export async function updateSellerProduct(
  productId: string,
  input: {
    name: string;
    description: string;
    price: number;
    category: string;
    inStock: boolean;
    shopId: string;
    sellerId: string;
    imageFile: File | null;
    existingImageUrl?: string;
  }
): Promise<void> {
  const f = await getFirebase();
  if (!f) throw new Error('Firebase not configured');
  const { doc, updateDoc, serverTimestamp } = await collectionRef();
  const ref = doc(f.db, 'products', productId);
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    category: input.category.trim(),
    inStock: input.inStock,
    updatedAt: serverTimestamp(),
  };
  if (input.imageFile) {
    payload.imageUrl = await uploadProductImage(input.shopId, productId, input.imageFile);
  } else if (input.existingImageUrl) {
    payload.imageUrl = input.existingImageUrl;
  }
  await updateDoc(ref, payload);
}

export async function setProductInStock(productId: string, inStock: boolean): Promise<void> {
  const f = await getFirebase();
  if (!f) throw new Error('Firebase not configured');
  const { doc, updateDoc, serverTimestamp } = await collectionRef();
  await updateDoc(doc(f.db, 'products', productId), {
    inStock,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSellerProduct(productId: string): Promise<void> {
  const f = await getFirebase();
  if (!f) throw new Error('Firebase not configured');
  const { doc, deleteDoc } = await collectionRef();
  await deleteDoc(doc(f.db, 'products', productId));
}
