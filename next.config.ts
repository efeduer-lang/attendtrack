import type { NextConfig } from "next";

const rawDjangoUrl = process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL;
const djangoUrl = rawDjangoUrl ? rawDjangoUrl.replace(/\/+$/, '') : '';

const nextConfig: NextConfig = {
  async rewrites() {
    if (!djangoUrl) return [];
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${djangoUrl}/api/:path*/`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

