'use client';

import { useCallback, useEffect, useState } from 'react';
import * as api from '@/lib/api';
import type { SubscriptionPlan, SubscriptionRecord } from '@/types';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.getPlans();
      setPlans((data.plans as SubscriptionPlan[]) || []);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to load plans';
      setError(msg || 'Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActiveSubscription = useCallback(async (shopId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.getShopSubscription(shopId);
      setSubscription((data.subscription as SubscriptionRecord) || null);
      return (data.subscription as SubscriptionRecord) || null;
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed';
      setError(msg || 'Failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getPlans();
  }, [getPlans]);

  const createOrder = useCallback(async (planId: string, shopId: string) => {
    const { data } = await api.createOrder(planId, shopId);
    return data as {
      orderId: string;
      amount: number;
      currency: string;
      razorpayKeyId: string;
    };
  }, []);

  const verifyPayment = useCallback(
    async (body: {
      orderId: string;
      paymentId: string;
      signature: string;
      shopId: string;
      planId: string;
    }) => {
      const { data } = await api.verifyPayment(body);
      setSubscription(data.subscription as SubscriptionRecord);
      return data.subscription as SubscriptionRecord;
    },
    []
  );

  return {
    subscription,
    plans,
    isLoading,
    error,
    getPlans,
    getActiveSubscription,
    createOrder,
    verifyPayment,
  };
}
