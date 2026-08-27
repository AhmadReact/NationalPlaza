import "server-only";

/**
 * Nest origin for SSR fetches and next.config rewrites.
 * Prefer API_URL (server-only). NEXT_PUBLIC_API_URL is a fallback for existing deploys.
 */
export function getServerApiOrigin(): string {
  const raw =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000";
  return raw.replace(/\/$/, "").replace(/\/api$/i, "");
}
