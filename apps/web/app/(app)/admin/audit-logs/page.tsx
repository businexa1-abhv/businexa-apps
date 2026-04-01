'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as api from '@/lib/api';
import { RoleGate } from '@/components/auth/RoleGate';
import { Card } from '@/components/ui/Card';

type LogRow = {
  _id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  changes?: { before?: unknown; after?: unknown };
  ipAddress?: string;
  createdAt?: string;
  userId?: { username?: string; email?: string; fullName?: string; role?: string };
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .adminAuditLogs({ limit: 100 })
      .then(({ data }) => {
        const d = data as { logs?: LogRow[] };
        setLogs(d.logs || []);
      })
      .catch((e) => {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        setErr(msg || 'Could not load audit logs (check admin permission: audit.view).');
      });
  }, []);

  return (
    <RoleGate allow={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Audit log</h1>
          <p className="mt-1 text-sm text-textLight">
            Recent platform and admin actions (newest first). Requires admin staff permission{' '}
            <code className="rounded bg-border/50 px-1 text-xs">audit.view</code>.
          </p>
        </div>

        {err ? <p className="text-sm text-danger">{err}</p> : null}

        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-background/80 text-textLight">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Resource</th>
                <th className="px-4 py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row._id} className="border-b border-border/80">
                  <td className="px-4 py-2 whitespace-nowrap text-textLight">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2">
                    {row.userId?.email || row.userId?.username || '—'}
                  </td>
                  <td className="px-4 py-2 font-medium">{row.action}</td>
                  <td className="px-4 py-2">
                    {row.resourceType}
                    {row.resourceId ? (
                      <span className="ml-1 text-xs text-textLight">({String(row.resourceId).slice(-8)})</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-textLight">{row.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!err && logs.length === 0 ? (
            <p className="p-6 text-center text-sm text-textLight">No entries yet.</p>
          ) : null}
        </Card>

        <Link href="/admin" className="inline-block text-sm text-primary hover:underline">
          ← Admin home
        </Link>
      </div>
    </RoleGate>
  );
}
