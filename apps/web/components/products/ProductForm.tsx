'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Product } from '@/types';

export type FirestoreFormPayload = {
  name: string;
  description: string;
  price: string;
  category: string;
  inStock: boolean;
  imageFile: File | null;
  existingImageUrl?: string;
};

export function ProductForm({
  initial,
  onSubmit,
  onSubmitFirestore,
  loading,
  categoryOptions,
  defaultCategory,
}: {
  initial?: Product | null;
  onSubmit?: (form: FormData) => Promise<void>;
  onSubmitFirestore?: (payload: FirestoreFormPayload) => Promise<void>;
  loading?: boolean;
  categoryOptions?: string[];
  defaultCategory?: string;
}) {
  const useFs = Boolean(onSubmitFirestore);
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(
    initial?.priceNumber != null ? String(initial.priceNumber) : ''
  );
  const [category, setCategory] = useState(initial?.category ?? defaultCategory ?? '');
  const [isVisible, setIsVisible] = useState(initial?.isVisible !== false);
  const [inStock, setInStock] = useState(() => {
    if (initial?.inStock != null) return initial.inStock;
    if (initial) return initial.isVisible !== false;
    return true;
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (initial) return;
    const d = defaultCategory?.trim();
    if (d) setCategory((c) => (c ? c : d));
  }, [initial, defaultCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitFirestore && !onSubmit) return;
    if (useFs && onSubmitFirestore) {
      await onSubmitFirestore({
        name: name.trim(),
        description,
        price,
        category,
        inStock,
        imageFile: file,
        existingImageUrl: initial?.imageUrl,
      });
      return;
    }
    if (!onSubmit) return;
    const form = new FormData();
    form.append('name', name.trim());
    form.append('description', description);
    form.append('price', price);
    form.append('category', category);
    form.append('isVisible', String(isVisible));
    if (file) form.append('image', file);
    else if (initial?.imageUrl && !file) form.append('imageUrl', initial.imageUrl);
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Name *</label>
        <Input value={name} onChange={setName} placeholder="Product name" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
          rows={4}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Price (INR) *</label>
        <Input type="text" inputMode="decimal" value={price} onChange={setPrice} placeholder="199" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        {!initial && defaultCategory ? (
          <p className="mb-1 text-xs text-textLight">
            Defaults to your shop&apos;s business type (e.g. Clothing). You can override for a more specific label.
          </p>
        ) : null}
        {categoryOptions && categoryOptions.length > 0 ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Select category</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <Input value={category} onChange={setCategory} placeholder="e.g. Snacks" />
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>
      {useFs ? (
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <span className="text-sm font-medium text-secondary">In stock</span>
          <button
            type="button"
            role="switch"
            aria-checked={inStock}
            onClick={() => setInStock((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${inStock ? 'bg-primary' : 'bg-border'}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                inStock ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
          Visible on public shop
        </label>
      )}
      <Button type="submit" className="w-full" loading={loading}>
        {initial ? 'Save changes' : 'Create product'}
      </Button>
    </form>
  );
}
