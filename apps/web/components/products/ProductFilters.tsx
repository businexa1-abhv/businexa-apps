'use client';

import { Input } from '@/components/ui/Input';

export function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  categories: string[];
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-textLight">Search</label>
        <Input placeholder="Search products…" value={search} onChange={onSearchChange} />
      </div>
      <div className="w-full md:w-48">
        <label className="mb-1 block text-xs text-textLight">Category</label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
