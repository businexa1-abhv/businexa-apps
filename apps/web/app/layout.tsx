import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function apiOrigin(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Businexa — Digital shop & QR catalog',
    template: '%s | Businexa',
  },
  description: 'Create your shop, share products, and grow with QR-powered discovery.',
  openGraph: {
    title: 'Businexa',
    description: 'Digital shop & QR catalog for small businesses.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const api = apiOrigin();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {api ? <link rel="preconnect" href={api} crossOrigin="anonymous" /> : null}
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body className="min-h-screen antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
