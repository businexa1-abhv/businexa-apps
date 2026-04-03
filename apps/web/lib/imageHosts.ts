/**
 * Hosts allowed for `next/image` (must stay in sync with `next.config.mjs` remotePatterns).
 * Add comma-separated hostnames via NEXT_PUBLIC_IMAGE_HOSTS for CDNs or custom storage.
 */
const DEFAULT_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'businexa.firebasestorage.app',
  'localhost',
  '127.0.0.1',
]);

export function isConfiguredRemoteImageHost(hostname: string): boolean {
  if (DEFAULT_HOSTS.has(hostname)) return true;
  const extra =
    typeof process.env.NEXT_PUBLIC_IMAGE_HOSTS === 'string'
      ? process.env.NEXT_PUBLIC_IMAGE_HOSTS.split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  return extra.includes(hostname);
}

/** Use native img for data URLs, blobs, or hosts not listed in Next image config. */
export function shouldUseNativeImg(src: string): boolean {
  if (src.startsWith('data:') || src.startsWith('blob:')) return true;
  try {
    const u = new URL(src);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return true;
    return !isConfiguredRemoteImageHost(u.hostname);
  } catch {
    return true;
  }
}
