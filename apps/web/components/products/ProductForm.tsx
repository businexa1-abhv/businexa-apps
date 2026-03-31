'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Product } from '@/types';

export function ProductForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Product | null;
  onSubmit: (form: FormData) => Promise<void>;
  loading?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(
    initial?.priceNumber != null ? String(initial.priceNumber) : ''
  );
  const [category, setCategory] = useState(initial?.category ?? '');
  const [isVisible, setIsVisible] = useState(initial?.isVisible !== false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <Input value={category} onChange={setCategory} placeholder="e.g. Snacks" />
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
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
        Visible on public shop
      </label>
      <Button type="submit" className="w-full" loading={loading}>
        {initial ? 'Save changes' : 'Create product'}
      </Button>
    </form>
  );
}
