/** Same-origin prefix the browser calls. Next rewrites this to the Nest host. */
export const CLIENT_API_BASE = "/api";

export function clientApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${CLIENT_API_BASE}${normalized}`;
}
