'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import * as api from '@/lib/api';
import { RoleGate } from '@/components/auth/RoleGate';
import { Button } from '@/components/ui/Button';
import type { UserRole } from '@/types';

type Row = {
  _id: string;
  username?: string;
  email?: string;
  mobileNumber?: string;
  role: UserRole;
  createdAt?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.adminListUsers({ limit: 100 });
      setUsers((data.users as Row[]) || []);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setRole = async (id: string, role: UserRole) => {
    try {
      await api.adminPatchUserRole(id, role);
      await load();
    } catch {
      setError('Could not update role');
    }
  };

  return (
    <RoleGate allow={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Users & roles</h1>
            <p className="text-sm text-textLight">Change buyer, seller, or admin. Use carefully in production.</p>
          </div>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            ← Admin home
          </Link>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {loading ? (
          <p className="text-textLight">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-border/80">
                    <td className="px-3 py-2">
                      <span className="font-medium">{u.username || u.mobileNumber || u._id}</span>
                    </td>
                    <td className="px-3 py-2 text-textLight">{u.email || '—'}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(['buyer', 'seller', 'admin'] as const).map((r) =>
                          u.role === r ? null : (
                            <Button key={r} type="button" variant="outline" size="sm" onClick={() => setRole(u._id, r)}>
                              Make {r}
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
