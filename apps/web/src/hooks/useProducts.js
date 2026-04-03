'use client';

import { useCallback, useState } from 'react';
import * as api from '@/lib/api';

export { useProducts } from '../../hooks/useProducts';

/** Buyer catalog: visible products across active shops */
export function useBrowseProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const browse = useCallback(async (businessType, p = 1, q = '') => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.browseProducts({
        businessType: businessType || undefined,
        category: businessType || undefined,
        q: q.trim() || undefined,
        page: p,
        limit: 24,
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
    } catch {
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, total, page, loading, error, browse };
}
