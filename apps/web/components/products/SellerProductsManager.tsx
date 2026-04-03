'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { SellerProductCard } from '@/components/products/SellerProductCard';
import { useSellerFirestoreProductList } from '@/hooks/useSellerFirestoreProductList';
import type { FirestoreProduct } from '@/types';

export function SellerProductsManager({
  shopId,
  firebaseUid,
  title = 'Products',
  showViewAllLink,
  emptyHint,
  filterSearch = '',
  filterCategory = '',
  showAddButton = true,
}: {
  shopId: string | undefined;
  firebaseUid: string | undefined;
  title?: string;
  showViewAllLink?: boolean;
  emptyHint?: string;
  /** Client-side filter (products page). */
  filterSearch?: string;
  filterCategory?: string;
  /** When false, hide the toolbar “Add product” (page may show its own). */
  showAddButton?: boolean;
}) {
  const router = useRouter();
  const { products, loading, error, busyId, toggleStock, remove } = useSellerFirestoreProductList(
    shopId,
    firebaseUid
  );
  const [deleteTarget, setDeleteTarget] = useState<FirestoreProduct | null>(null);

  const filtered = useMemo(() => {
    const q = filterSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchQ =
        !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
      const matchC = !filterCategory || p.category === filterCategory;
      return matchQ && matchC;
    });
  }, [products, filterSearch, filterCategory]);

  if (!firebaseUid) {
    return (
      <p className="text-sm text-textLight">
        Your account is not linked to Firebase. Product management requires a linked Firebase seller account.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {title ? <h2 className="text-lg font-semibold text-secondary">{title}</h2> : <span />}
        <div className="flex flex-wrap gap-2">
          {showAddButton ? (
            <Link
              href="/products/new"
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Add product
            </Link>
          ) : null}
          {showViewAllLink ? (
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-secondary hover:bg-background"
            >
              View all →
            </Link>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-textLight">Loading…</p> : null}
      {!loading && !filtered.length ? (
        <p className="text-center text-textLight py-8">{emptyHint ?? 'No products yet.'}</p>
      ) : null}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <SellerProductCard
              key={p._id}
              product={p}
              busyId={busyId}
              onEdit={() => router.push(`/products/${p._id}/edit`)}
              onDelete={() => setDeleteTarget(p)}
              onToggleStock={(next) => void toggleStock(p._id, next)}
            />
          ))}
        </div>
      ) : null}

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete product?"
        actions={[
          { label: 'Cancel', onClick: () => setDeleteTarget(null), variant: 'outline' },
          {
            label: 'Delete',
            onClick: () => {
              if (deleteTarget) void remove(deleteTarget._id).then(() => setDeleteTarget(null));
            },
          },
        ]}
      >
        <p className="text-sm text-textLight">
          {deleteTarget ? `Remove “${deleteTarget.name}”? This cannot be undone.` : null}
        </p>
      </Modal>
    </div>
  );
}
