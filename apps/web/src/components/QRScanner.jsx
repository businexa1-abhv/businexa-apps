'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Extract shop id/slug from QR payload. Expected form: URL path `/shop/:shopId`
 * (full URL or path-only). Matches API `GET /shops/:shopIdOrSlug`.
 */
export function parseShopPathFromQr(decodedText) {
  const raw = String(decodedText || '').trim();
  if (!raw) return null;

  const pathMatch = raw.match(/\/shop\/([^/?#]+)/i);
  if (pathMatch) {
    try {
      return decodeURIComponent(pathMatch[1]);
    } catch {
      return pathMatch[1];
    }
  }

  try {
    const u = new URL(raw);
    const m = u.pathname.match(/\/shop\/([^/]+)/i);
    if (m) {
      try {
        return decodeURIComponent(m[1]);
      } catch {
        return m[1];
      }
    }
  } catch {
    // not a full URL
  }

  return null;
}

/**
 * Camera QR scan (html5-qrcode). On success, navigates to `/shop/[shopId]` (Mongo id or slug).
 */
export function QRScanner() {
  const router = useRouter();
  const [err, setErr] = useState(null);

  useEffect(() => {
    const html5Ref = { current: null };
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const h = new Html5Qrcode('qr-reader-region');
        html5Ref.current = h;
        await h.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            const shopId = parseShopPathFromQr(decodedText);
            if (!shopId) return;
            void h.stop().catch(() => {});
            router.push(`/shop/${encodeURIComponent(shopId)}`);
          },
          () => {}
        );
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Could not start camera');
      }
    })();

    return () => {
      cancelled = true;
      const h = html5Ref.current;
      if (h) {
        h.stop().catch(() => {});
        html5Ref.current = null;
      }
    };
  }, [router]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-textLight">
        QR codes should encode a shop URL like <code className="rounded bg-background px-1">/shop/your-shop-id</code> (or the
        full site URL with that path).
      </p>
      <div id="qr-reader-region" className="mx-auto w-full max-w-md overflow-hidden rounded-lg border border-border" />
      {err ? <p className="text-center text-sm text-danger">{err}</p> : null}
    </div>
  );
}
