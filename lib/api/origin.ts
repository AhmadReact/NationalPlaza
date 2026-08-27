const DEFAULT_API_ORIGIN = "https://api.nationaleshop.com";

/**
 * Nest origin for SSR fetches and next.config rewrites.
 * Prefer API_URL (server-only). NEXT_PUBLIC_API_URL is a fallback for existing deploys.
 * Default is the public API — never localhost, which 404s storefront pages
 * and triggers Chrome's local-network permission prompt.
 */
export function resolveApiOrigin(): string {
  const raw =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN;
  return raw.replace(/\/$/, "").replace(/\/api$/i, "");
}
