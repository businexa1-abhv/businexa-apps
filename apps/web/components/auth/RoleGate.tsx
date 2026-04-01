'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export function RoleGate({ allow, children }: { allow: UserRole[]; children: React.ReactNode }) {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (role && !allow.includes(role)) {
      router.replace('/dashboard');
    }
  }, [allow, role, router]);

  if (!role) {
    return (
      <p className="text-textLight" role="status">
        Loading…
      </p>
    );
  }

  if (!allow.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
