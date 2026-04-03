'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as api from '@/lib/api';
import { RoleGate } from '@/components/auth/RoleGate';
import { Card } from '@/components/ui/Card';

const AdminUsersPanel = dynamic(() =>
  import('@/components/admin/AdminUsersPanel').then((m) => ({ default: m.AdminUsersPanel }))
);

type Stats = {
  usersByRole?: { _id: string; count: number }[];
  shopCount?: number;
  productCount?: number;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .adminStats()
      .then(({ data }) => setStats(data as Stats))
      .catch(() => setErr('Could not load stats'));
  }, []);

  return (
    <RoleGate allow={['admin']}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Admin</h1>
          <p className="mt-1 text-textLight">
            Stats below; the full user table is on this page (scroll down) and on{' '}
            <Link href="/admin/users" className="text-primary hover:underline">
              /admin/users
            </Link>
            .
          </p>
        </div>

        {err ? <p className="text-sm text-danger">{err}</p> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-textLight">Shops</p>
            <p className="text-2xl font-semibold text-secondary">{stats?.shopCount ?? '—'}</p>
          </Card>
          <Card>
            <p className="text-sm text-textLight">Products</p>
            <p className="text-2xl font-semibold text-secondary">{stats?.productCount ?? '—'}</p>
          </Card>
          <Card>
            <p className="text-sm text-textLight">Users by role</p>
            <ul className="mt-2 text-sm text-text">
              {stats?.usersByRole?.map((r) => (
                <li key={r._id}>
                  {r._id}: {r.count}
                </li>
              )) ?? '—'}
            </ul>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/users"
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            User list (full page)
          </Link>
          <Link
            href="/admin/audit-logs"
            className="inline-flex rounded-md border border-border px-4 py-2 text-sm hover:bg-background"
          >
            Audit log
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex rounded-md border border-border px-4 py-2 text-sm hover:bg-background"
          >
            All products
          </Link>
          <Link href="/dashboard" className="inline-flex rounded-md border border-border px-4 py-2 text-sm hover:bg-background">
            Back to dashboard
          </Link>
        </div>

        <AdminUsersPanel variant="embedded" />
      </div>
    </RoleGate>
  );
}
