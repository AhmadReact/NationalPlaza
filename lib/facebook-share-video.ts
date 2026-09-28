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

function requestBody(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const request = get(
      url,
      {
        headers: {
          accept: "text/html",
          "user-agent": "Mozilla/5.0",
        },
      },
      (response) => {
        if ((response.statusCode ?? 0) < 200 || (response.statusCode ?? 0) >= 300) {
          response.resume();
          finish(null);
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 400_000) {
            response.destroy();
            finish(Buffer.concat(chunks).toString("utf8"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => finish(Buffer.concat(chunks).toString("utf8")));
        response.on("error", () => finish(null));
      },
    );

    request.setTimeout(8000, () => {
      request.destroy();
      finish(null);
    });
    request.on("error", () => finish(null));
  });
}

function portraitReelHref(html: string): string | null {
  const aspectMatch = html.match(/"aspect_ratio":(\d+(?:\.\d+)?)/);
  const aspect = aspectMatch ? Number(aspectMatch[1]) : null;
  const reelMatch = html.match(
    /"video_(?:url|path)":"(?:https:\\\/\\\/www\.facebook\.com)?(\\\/reel\\\/\d+\\\/?)"/,
  );
  const reelPath = reelMatch?.[1]?.replace(/\\\//g, "/");
  const portrait = aspect !== null && Number.isFinite(aspect) && aspect < 0.9;
  if (!reelPath && !portrait) return null;
  if (!reelPath) return null;
  return `https://www.facebook.com${reelPath}`;
}

export type PlayableEmbed = {
  embedUrl: string;
  portrait: boolean;
};

async function withResolvedShareHref(video: ProductVideo): Promise<PlayableEmbed> {
  if (video.provider !== "FACEBOOK") {
    return { embedUrl: video.embedUrl, portrait: false };
  }

  const embed = asUrl(video.embedUrl);
  if (!embed) return { embedUrl: video.embedUrl, portrait: false };

  const href = embed.searchParams.get("href") ?? video.url;
  const source = asUrl(href);
  if (source && isShareUrl(source)) {
    const permalink = await followToPermalink(source.toString());
    if (permalink) embed.searchParams.set("href", permalink);
  }

  let embedUrl = embed.toString();
  if (/\/share\/r\/|\/reel\//i.test(`${video.url} ${embedUrl}`)) {
    return { embedUrl, portrait: true };
  }

  const html = await requestBody(embedUrl);
  const reelHref = html ? portraitReelHref(html) : null;
  if (!reelHref) return { embedUrl, portrait: false };

  embed.searchParams.set("href", reelHref);
  embedUrl = embed.toString();
  return { embedUrl, portrait: true };
}

/** Facebook's player cannot open /share/ links. Resolve those to the video page. */
export const playableEmbedUrl = cache(withResolvedShareHref);
