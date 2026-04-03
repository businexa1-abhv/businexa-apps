'use client';

import Link from 'next/link';
import { QRScanner } from '@src/components/QRScanner';
import { BuyerCatalogGate } from '@/components/buyer/BuyerCatalogGate';
import { useAuthStore } from '@/store/authStore';

export default function ScanPage() {
  const role = useAuthStore((s) => s.user?.role);
  const buyerAccess = useAuthStore((s) => s.user?.buyerAccess);
  const blocked = role === 'buyer' && buyerAccess && buyerAccess.canAccessPremium === false;

  if (blocked) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-secondary">Scan QR</h1>
        <BuyerCatalogGate variant="compact" />
        <p className="text-center text-sm text-textLight">
          <Link href="/explore" className="text-primary hover:underline">
            Browse shops
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">Scan QR</h1>
      <p className="text-sm text-textLight">Point your camera at a shop or product QR to open it.</p>
      <QRScanner />
    </div>
  );
}
