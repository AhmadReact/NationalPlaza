import type { NextConfig } from "next";

function getApiOrigin(): string {
  const raw =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000";
  return raw.replace(/\/$/, "").replace(/\/api$/i, "");
}

const nextConfig: NextConfig = {
  async rewrites() {
    const origin = getApiOrigin();
    return [
      {
        source: "/api/:path*",
        destination: `${origin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
