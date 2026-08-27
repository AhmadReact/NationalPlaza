import "server-only";
import { resolveApiOrigin } from "@/lib/api/origin";

export function getServerApiOrigin(): string {
  return resolveApiOrigin();
}
