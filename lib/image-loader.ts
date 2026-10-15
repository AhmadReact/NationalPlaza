"use client";

const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

/**
 * Serves Supabase files through Storage image transforms.
 * Vercel's /_next/image optimizer returns 402 once the plan quota is used,
 * which leaves product photos blank until a cached copy exists.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!src.includes("supabase.co")) return src;
  if (!src.includes(OBJECT_PATH) && !src.includes(RENDER_PATH)) return src;

  const url = new URL(src);
  if (url.pathname.includes(OBJECT_PATH)) {
    url.pathname = url.pathname.replace(OBJECT_PATH, RENDER_PATH);
  }
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality ?? 75));
  url.searchParams.set("resize", "contain");
  return url.href;
}
