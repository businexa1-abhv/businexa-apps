'use client';

import { RoleGate } from '@/components/auth/RoleGate';
import { AdminUsersPanel } from '@/components/admin/AdminUsersPanel';

export default function AdminUsersPage() {
  return (
    <RoleGate allow={['admin']}>
      <AdminUsersPanel variant="page" />
    </RoleGate>
  );
}
