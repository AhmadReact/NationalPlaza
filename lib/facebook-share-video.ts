import "server-only";
import { get } from "node:https";
import { cache } from "react";
import type { ProductVideo } from "@/app/store/customerAPI";

const SHARE_PATH = /^\/share\/(?:r|v|p)\//i;

function asUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isFacebookHost(url: URL): boolean {
  return (
    url.hostname === "facebook.com" ||
    url.hostname.endsWith(".facebook.com") ||
    url.hostname === "fb.watch" ||
    url.hostname.endsWith(".fb.watch")
  );
}

function isShareUrl(url: URL): boolean {
  return isFacebookHost(url) && SHARE_PATH.test(url.pathname);
}

function isVideoPermalink(url: URL): boolean {
  if (!isFacebookHost(url)) return false;
  const path = url.pathname;
  if (path === "/watch" || path === "/watch/") {
    return url.searchParams.has("v");
  }
  return (
    /\/reel\/[^/]+\/?$/i.test(path) ||
    /\/videos\/\d+\/?$/i.test(path) ||
    /\/videos\/[^/]+\/\d+\/?$/i.test(path)
  );
}

function cleanPermalink(url: URL): string {
  const cleaned = new URL(url.href);
  if (cleaned.pathname === "/watch" || cleaned.pathname === "/watch/") {
    const id = cleaned.searchParams.get("v");
    cleaned.search = "";
    if (id) cleaned.searchParams.set("v", id);
  } else {
    cleaned.search = "";
    cleaned.hash = "";
  }
  return cleaned.toString();
}

function requestLocation(
  url: string,
): Promise<{ status: number; location: string | null }> {
  return new Promise((resolve, reject) => {
    const request = get(
      url,
      {
        headers: {
          accept: "text/html",
          "user-agent": "Mozilla/5.0",
        },
      },
      (response) => {
        response.resume();
        const location = response.headers.location;
        resolve({
          status: response.statusCode ?? 0,
          location: Array.isArray(location) ? (location[0] ?? null) : (location ?? null),
        });
      },
    );
    request.on("error", reject);
  });
}

async function followToPermalink(start: string): Promise<string | null> {
  let current = start;

  for (let hop = 0; hop < 5; hop += 1) {
    const response = await requestLocation(current);
    if (response.status < 300 || response.status >= 400 || !response.location) {
      return null;
    }

    const next = new URL(response.location, current);
    if (!isFacebookHost(next)) return null;
    if (isVideoPermalink(next)) return cleanPermalink(next);
    current = next.toString();
  }

  return null;
}

async function withResolvedShareHref(video: ProductVideo): Promise<string> {
  if (video.provider !== "FACEBOOK") return video.embedUrl;

  const embed = asUrl(video.embedUrl);
  const href = embed?.searchParams.get("href") ?? video.url;
  const share = asUrl(href);
  if (!embed || !share || !isShareUrl(share)) return video.embedUrl;

  const permalink = await followToPermalink(share.toString());
  if (!permalink) return video.embedUrl;

  embed.searchParams.set("href", permalink);
  return embed.toString();
}

/** Facebook's player cannot open /share/ links. Resolve those to the video page. */
export const playableEmbedUrl = cache(withResolvedShareHref);
