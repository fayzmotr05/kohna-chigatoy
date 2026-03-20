import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kvmlolmwypsmirlxqvtn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/models/:path*',
        destination: 'https://kvmlolmwypsmirlxqvtn.supabase.co/storage/v1/object/public/media/models/:path*',
      },
    ];
  },
};

export default nextConfig;
