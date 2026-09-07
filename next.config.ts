import type { NextConfig } from "next";
import { resolveApiOrigin } from "./lib/api/origin";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.14"],
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
