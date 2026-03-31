'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api';

export function useFetch<T>(url: string | null, config?: AxiosRequestConfig, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<T>(url, config);
      setData(res.data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Request failed';
      setError(msg || 'Request failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, config]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  return { data, loading, error, refetch };
}
