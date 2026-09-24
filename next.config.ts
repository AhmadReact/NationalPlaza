import type { NextConfig } from "next";
import { resolveApiOrigin } from "./lib/api/origin";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.14"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async rewrites() {
    const origin = resolveApiOrigin();
    return [
      {
        source: "/api/:path*",
        destination: `${origin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
