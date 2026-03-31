'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessDetailsForm } from '@/components/auth/BusinessDetailsForm';
import { useShop } from '@/hooks/useShop';

export default function BusinessDetailsPage() {
  const router = useRouter();
  const { shop, isLoading } = useShop();

  useEffect(() => {
    if (!isLoading && shop) {
      router.replace('/dashboard');
    }
  }, [isLoading, shop, router]);

  if (isLoading) {
    return <p className="text-textLight">Loading…</p>;
  }

  if (shop) {
    return null;
  }

  return <BusinessDetailsForm />;
}
