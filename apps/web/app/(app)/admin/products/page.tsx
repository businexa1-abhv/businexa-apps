'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import * as api from '@/lib/api';
import { RoleGate } from '@/components/auth/RoleGate';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.getMyProducts(1, 100);
      setProducts((data.products as Product[]) || []);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      await load();
    } catch {
      setError('Could not delete product');
    }
  };

  return (
    <RoleGate allow={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary">All products</h1>
            <p className="text-sm text-textLight">Platform-wide catalog (admin). Delete or edit from owner flows.</p>
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
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Shop</th>
                  <th className="px-3 py-2 font-medium">Visible</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-b border-border/80">
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2 text-textLight">{p.shopId}</td>
                    <td className="px-3 py-2">{p.isVisible !== false ? 'yes' : 'no'}</td>
                    <td className="px-3 py-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => remove(p._id)}>
                        Delete
                      </Button>
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
