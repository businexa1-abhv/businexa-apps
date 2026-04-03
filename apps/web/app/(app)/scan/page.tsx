'use client';

import { QRScanner } from '@src/components/QRScanner';

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">Scan QR</h1>
      <QRScanner />
    </div>
  );
}
