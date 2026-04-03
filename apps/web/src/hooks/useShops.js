'use client';

import { useCallback, useEffect, useState } from 'react';
import * as api from '@/lib/api';

const DEFAULT_LIMIT = 100;

export function useShops() {
  const [shops, setShops] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const browseShops = useCallback(async (category, p = 1, limit = DEFAULT_LIMIT) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.browseShops({
        businessType: category || undefined,
        category: category || undefined,
        page: p,
        limit,
      });
      setShops(data.shops || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
    } catch {
      setError('Failed to load shops');
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { shops, total, page, loading, error, browseShops };
}

export function useBusinessCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getBusinessCategories()
      .then(({ data }) => {
        if (cancelled) return;
        const list = (data.categories || []).map((c) => c.name).filter(Boolean);
        setCategories(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading };
}
