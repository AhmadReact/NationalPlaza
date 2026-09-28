"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductVideo } from "@/app/store/customerAPI";
import type { ArtKind } from "@/lib/data";
import { ApplianceArt } from "./appliance-art";
import { isMobileVideo, ProductIntroVideo } from "./product-intro-video";

type GalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
};

interface ArtView {
  id: string;
  label: string;
  bg: string;
  artClass: string;
}

export function ProductGallery({
  kind,
  tint,
  discount,
  badge,
  images = [],
  productName,
  video = null,
}: {
  kind: ArtKind;
  tint: string;
  discount: number | null;
  badge?: string;
  images?: GalleryImage[];
  productName?: string;
  video?: ProductVideo | null;
}) {
  const hasImages = images.length > 0;

  const artViews: ArtView[] = [
    {
      id: "front",
      label: "Front view",
      bg: `bg-gradient-to-br ${tint}`,
      artClass: "h-56 w-56 sm:h-72 sm:w-72 text-brand-900/70",
    },
    {
      id: "detail",
      label: "Close-up",
      bg: `bg-gradient-to-tl ${tint}`,
      artClass:
        "h-72 w-72 sm:h-96 sm:w-96 text-brand-900/60 translate-x-8 -translate-y-4",
    },
    {
      id: "night",
      label: "Studio view",
      bg: "bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700",
      artClass: "h-56 w-56 sm:h-72 sm:w-72 text-gold-300/90",
    },
  ];

  const imageCount = hasImages ? images.length : artViews.length;
  const videoIndex = imageCount;
  const slideCount = imageCount + (video ? 1 : 0);

  const [active, setActive] = useState(0);
  const safeActive = Math.min(active, Math.max(slideCount, 1) - 1);
  const showingVideo = Boolean(video) && safeActive === videoIndex;
  const activeImage = hasImages && !showingVideo ? images[safeActive] : undefined;

  return (
    <div>
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm ${
          showingVideo || hasImages ? "bg-white" : artViews[safeActive]?.bg
        }`}
      >
        {showingVideo && video ? (
          <div
            className={
              isMobileVideo(video)
                ? "absolute inset-y-0 left-1/2 -translate-x-1/2"
                : "absolute inset-x-0 top-1/2 w-full -translate-y-1/2"
            }
            style={{
              aspectRatio: isMobileVideo(video) ? "9 / 16" : "16 / 9",
            }}
          >
            <ProductIntroVideo
              video={video}
              productName={productName || "Product"}
              fit="stage"
            />
          </div>
        ) : hasImages && activeImage ? (
          <div className="absolute inset-6 sm:inset-10">
            <Image
              src={activeImage.url}
              alt={activeImage.alt || productName || "Product image"}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain object-center"
            />
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center">
            <ApplianceArt
              kind={kind}
              className={`transition-all duration-500 ${artViews[safeActive].artClass}`}
            />
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {discount !== null && (
            <span className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow">
              SAVE {discount}%
            </span>
          )}
          {badge && (
            <span className="rounded-full bg-brand-950 px-3 py-1.5 text-xs font-semibold text-gold-300 shadow">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {hasImages
          ? images.map((image, i) => (
              <button
                key={image.id}
                onClick={() => setActive(i)}
                aria-label={image.alt || `Image ${i + 1}`}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-gradient-to-br ${tint} transition-all ${
                  i === safeActive
                    ? "border-brand-700 shadow-md scale-105"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.alt || productName || `Image ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1.5"
                />
              </button>
            ))
          : artViews.map((view, i) => (
              <button
                key={view.id}
                onClick={() => setActive(i)}
                aria-label={view.label}
                className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 transition-all ${view.bg} ${
                  i === safeActive
                    ? "border-brand-700 shadow-md scale-105"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <ApplianceArt
                  kind={kind}
                  className={`h-12 w-12 ${
                    view.id === "night" ? "text-gold-300/90" : "text-brand-900/70"
                  }`}
                />
              </button>
            ))}
        {video ? (
          <button
            type="button"
            onClick={() => setActive(videoIndex)}
            aria-label={`${productName || "Product"} video`}
            className={`relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 bg-brand-950 text-white transition-all ${
              showingVideo
                ? "border-brand-700 shadow-md scale-105"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.2-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
