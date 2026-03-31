import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';

export const metadata: Metadata = {
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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
