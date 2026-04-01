'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import * as api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

type Row = {
  _id: string;
  username?: string;
  email?: string;
  mobileNumber?: string;
  role: UserRole;
  createdAt?: string;
};

type AdminPermUsers = { view?: boolean; edit?: boolean; delete?: boolean };

type AdminMePayload = {
  adminPermissions?: {
    users?: AdminPermUsers;
    adminManagement?: boolean;
  };
};

type Props = {
  /** On `/admin` home — compact heading; full page uses larger title + back link. */
  variant?: 'page' | 'embedded';
};

export function AdminUsersPanel({ variant = 'page' }: Props) {
  const embedded = variant === 'embedded';
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const [users, setUsers] = useState<Row[]>([]);
  const [adminMe, setAdminMe] = useState<AdminMePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [createFullName, setCreateFullName] = useState('');
  const [createBusy, setCreateBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, meRes] = await Promise.all([
        api.adminListUsers({ limit: 100 }),
        api.adminGetMe(),
      ]);
      setUsers((listRes.data.users as Row[]) || []);
      setAdminMe(meRes.data as AdminMePayload);
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

  const canEdit = adminMe?.adminPermissions?.users?.edit === true;
  const canDelete = adminMe?.adminPermissions?.users?.delete === true;
  const canCreateAdmin = adminMe?.adminPermissions?.adminManagement === true;

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setCreateBusy(true);
    setError(null);
    try {
      const payload: api.AdminCreateUserPayload = {
        username: createEmail.trim(),
        password: createPassword,
        role: createRole,
        fullName: createFullName.trim() || undefined,
      };
      if (createRole === 'admin' && canCreateAdmin) {
        payload.adminLevel = 'super-admin';
      }
      await api.adminCreateUser(payload);
      setCreateEmail('');
      setCreatePassword('');
      setCreateFullName('');
      setCreateRole('buyer');
      await load();
    } catch {
      setError('Could not create user (check permissions and password strength)');
    } finally {
      setCreateBusy(false);
    }
  };

  const removeUser = async (id: string) => {
    if (!canDelete || !currentUserId || id === currentUserId) return;
    if (!window.confirm('Permanently delete this user and their shops/products data?')) return;
    setError(null);
    try {
      await api.adminDeleteUser(id);
      await load();
    } catch {
      setError('Could not delete user');
    }
  };

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Users & roles</h1>
            <p className="text-sm text-textLight">
              List, create (email/password), update roles, and delete (super-admin). OTP users are created via signup.
            </p>
          </div>
          <Link href="/admin" className="text-sm text-primary hover:underline shrink-0">
            ← Admin home
          </Link>
        </div>
      ) : (
        <div className="border-t border-border pt-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-secondary">All users</h2>
              <p className="text-sm text-textLight">
                Full list from your database — same tools as the{' '}
                <Link href="/admin/users" className="text-primary hover:underline">
                  dedicated user page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {canEdit ? (
        <form
          onSubmit={createUser}
          className="rounded-lg border border-border bg-background p-4 space-y-3 max-w-xl"
        >
          <h2 className="text-sm font-semibold text-secondary">Create email/password user</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-textLight block">
              Email (login)
              <input
                type="email"
                required
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="mt-1 w-full rounded border border-border px-2 py-1.5 text-sm"
                autoComplete="off"
              />
            </label>
            <label className="text-xs text-textLight block">
              Password
              <input
                type="password"
                required
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                className="mt-1 w-full rounded border border-border px-2 py-1.5 text-sm"
                autoComplete="new-password"
              />
            </label>
            <label className="text-xs text-textLight block">
              Role
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value as 'buyer' | 'seller' | 'admin')}
                className="mt-1 w-full rounded border border-border px-2 py-1.5 text-sm"
              >
                <option value="buyer">buyer</option>
                <option value="seller">seller</option>
                {canCreateAdmin ? <option value="admin">admin</option> : null}
              </select>
            </label>
            <label className="text-xs text-textLight block">
              Full name (optional)
              <input
                type="text"
                value={createFullName}
                onChange={(e) => setCreateFullName(e.target.value)}
                className="mt-1 w-full rounded border border-border px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <Button type="submit" size="sm" disabled={createBusy}>
            {createBusy ? 'Creating…' : 'Create user'}
          </Button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-textLight">Loading users…</p>
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-textLight">
                    No users returned. If you expected rows, check the API and your admin permissions.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-border/80">
                    <td className="px-3 py-2">
                      <span className="font-medium">{u.username || u.mobileNumber || u._id}</span>
                    </td>
                    <td className="px-3 py-2 text-textLight">{u.email || '—'}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1 items-center">
                        {(['buyer', 'seller', 'admin'] as const).map((r) =>
                          u.role === r ? null : (
                            <Button
                              key={r}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setRole(u._id, r)}
                            >
                              Make {r}
                            </Button>
                          )
                        )}
                        {canDelete && currentUserId && u._id !== currentUserId ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-danger border-danger/40"
                            onClick={() => removeUser(u._id)}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
