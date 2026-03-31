'use client';

import { useCallback, useState } from 'react';
import * as api from '@/lib/api';
import type { Product } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const getProducts = useCallback(async (p = 1, limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.getMyProducts(p, limit);
      setProducts((data.products as Product[]) || []);
      setTotalCount((data.total as number) || 0);
      setPage((data.page as number) || p);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to load products';
      setError(msg || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProductById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.getProduct(id);
      const p = data.product as Product;
      setSelectedProduct(p);
      return p;
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Not found';
      setError(msg || 'Not found');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (form: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.createProductForm(form);
      return data.product as Product;
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Create failed';
      setError(msg || 'Create failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (id: string, form: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.updateProductForm(id, form);
      return data.product as Product;
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Update failed';
      setError(msg || 'Update failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((x) => x._id !== id));
      return true;
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Delete failed';
      setError(msg || 'Delete failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    products,
    selectedProduct,
    isLoading,
    error,
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    totalCount,
    page,
    setPage,
    setSelectedProduct,
  };
}
