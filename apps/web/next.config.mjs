import bundleAnalyzer from '@next/bundle-analyzer';

function imageRemotePatterns() {
  const fromEnv = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((hostname) => ({
      protocol: 'https',
      hostname,
      pathname: '/**',
    }));

  return [
    { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
    { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
    { protocol: 'https', hostname: 'businexa.firebasestorage.app', pathname: '/**' },
    { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
    ...fromEnv,
  ];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@businexa/shared'],
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: imageRemotePatterns(),
  },
  experimental: {
    optimizePackageImports: ['@businexa/shared', 'axios', 'zustand'],
  },
};

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

export default withBundleAnalyzer(nextConfig);
