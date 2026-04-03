'use client';

import { QRCodeSVG } from 'qrcode.react';

/**
 * Vector QR preview (qrcode.react). Server PNGs / uploads still come from the API `generate-qr` flow.
 */
export function QRGenerator({ value, size = 160 }) {
  if (!value) return null;
  return (
    <div className="inline-block rounded-lg bg-white p-2">
      <QRCodeSVG value={value} size={size} level="M" includeMargin />
    </div>
  );
}
