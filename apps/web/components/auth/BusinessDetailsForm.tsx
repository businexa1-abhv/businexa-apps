'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as api from '@/lib/api';

const CATEGORIES = ['General', 'Food', 'Fashion', 'Electronics', 'Services', 'Other'];

export function BusinessDetailsForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: created } = await api.createShop({
        name: name.trim(),
        address: address.trim(),
        category,
        whatsappNumber: whatsappNumber.replace(/\D/g, '').slice(0, 10) || undefined,
        email: email.trim() || undefined,
      });
      const shop = created.shop as { _id?: string } | undefined;
      if (logoUrl.trim() && shop?._id) {
        await api.updateShop(shop._id, { logoUrl: logoUrl.trim() });
      }
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Could not create shop';
      setError(msg || 'Could not create shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-secondary">Set up your shop</h1>
      <p className="text-sm text-textLight">Tell customers about your business.</p>
      <div>
        <label className="mb-1 block text-sm font-medium">Shop name *</label>
        <Input placeholder="My Store" value={name} onChange={setName} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Address</label>
        <Input placeholder="Street, city, PIN" value={address} onChange={setAddress} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">WhatsApp</label>
        <Input
          type="tel"
          prefix="+91"
          placeholder="9876543210"
          value={whatsappNumber}
          onChange={(v) => setWhatsappNumber(v.replace(/\D/g, '').slice(0, 10))}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <Input type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Logo URL (optional)</label>
        <Input placeholder="https://…" value={logoUrl} onChange={setLogoUrl} />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="w-full" loading={loading} disabled={!name.trim()}>
        Save & go to dashboard
      </Button>
    </form>
  );
}
