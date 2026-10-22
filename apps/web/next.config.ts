import type { NextConfig } from 'next';

const s3 = new URL(process.env.NEXT_PUBLIC_S3_PUBLIC_URL ?? 'http://localhost:9000/artworks');
const apiOrigin = new URL(process.env.API_INTERNAL_URL ?? 'http://localhost:4000').origin;

const nextConfig: NextConfig = {
  // 'use cache' + cacheTag: каталог кэшируется и сбрасывается вебхуком из API
  cacheComponents: true,
  partialPrefetching: true,
  // workspace-пакеты отдаются исходниками на TS
  transpilePackages: ['@asya/ui', '@asya/api-client', '@asya/shared'],
  images: {
    remotePatterns: [
      {
        protocol: s3.protocol.replace(':', '') as 'http' | 'https',
        hostname: s3.hostname,
        port: s3.port,
        pathname: `${s3.pathname.replace(/\/$/, '')}/**`,
      },
    ],
    // MinIO в разработке живёт на localhost; в проде S3/CDN — публичный адрес
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
  // без Caddy (просто `next dev`) браузерные запросы к /api уходят в Nest
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
