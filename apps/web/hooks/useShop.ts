'use client';

import { useCallback, useEffect, useState } from 'react';
import * as api from '@/lib/api';
import type { Shop } from '@/types';

export function useShop() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getShop = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.getMyShop();
      setShop((data.shop as Shop) || null);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to load shop';
      setError(msg || 'Failed to load shop');
      setShop(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getShop();
  }, [getShop]);

  const updateShop = useCallback(async (shopId: string, payload: Record<string, unknown>) => {
    const { data } = await api.updateShop(shopId, payload);
    setShop(data.shop as Shop);
    return data.shop as Shop;
  }, []);

  const getPublicShop = useCallback(async (slug: string) => {
    const { data } = await api.getPublicShop(slug);
    return data.shop as Shop;
  }, []);

  const generateQRCode = useCallback(async (shopId: string) => {
    const { data } = await api.generateShopQr(shopId);
    return data.qrCodeUrl as string;
  }, []);

  return {
    shop,
    isLoading,
    error,
    getShop,
    updateShop,
    getPublicShop,
    generateQRCode,
  };
}
