"use client";

import { useState } from "react";
import type { ArtKind } from "@/lib/data";
import { ApplianceArt } from "./appliance-art";

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
}: {
  kind: ArtKind;
  tint: string;
  discount: number | null;
  badge?: string;
  images?: GalleryImage[];
  productName?: string;
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

  const [active, setActive] = useState(0);
  const safeActive = Math.min(active, Math.max(images.length, artViews.length) - 1);

  return (
    <div>
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm ${
          hasImages
            ? "bg-white"
            : artViews[safeActive]?.bg
        }`}
      >
        {hasImages ? (
          <div className="absolute inset-6 sm:inset-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[safeActive]?.url}
              alt={
                images[safeActive]?.alt ||
                productName ||
                "Product image"
              }
              className="h-full w-full object-contain object-center"
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt || productName || `Image ${i + 1}`}
                  className="h-full w-full object-contain p-1.5"
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
      </div>
    </div>
  );
}
