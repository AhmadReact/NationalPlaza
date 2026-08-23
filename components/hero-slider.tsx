"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { heroSlides } from "@/lib/data";
import { ApplianceArt } from "./appliance-art";
import {
  BannerImage,
  BannerLink,
  useLiveStoreBanners,
} from "@/components/storefront-banners";
import type { Banner } from "@/app/admin/(panel)/banners/store/bannerAPI";

const AUTOPLAY_MS = 5000;

export function HeroSlider() {
  const { data, isLoading } = useLiveStoreBanners({ placement: "HOME_HERO" });
  const banners = (data?.data ?? []).filter((banner) => banner.imageUrl);

  if (isLoading && banners.length === 0) {
    return (
      <section aria-label="Special offers" className="relative">
        <div className="h-[540px] animate-pulse bg-zinc-950 sm:h-[600px] lg:h-[640px]" />
      </section>
    );
  }

  if (banners.length > 0) {
    return <CmsHeroSlider banners={banners} />;
  }

  return <StaticHeroSlider />;
}

function CmsHeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = banners.length;

  const goTo = useCallback(
    (i: number) => {
      setIndex((i + count) % count);
    },
    [count],
  );

  const restartAutoplay = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (count < 2) return;
    timer.current = setInterval(
      () => setIndex((value) => (value + 1) % count),
      AUTOPLAY_MS,
    );
  }, [count]);

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [restartAutoplay]);

  function handleNav(i: number) {
    goTo(i);
    restartAutoplay();
  }

  return (
    <section aria-label="Special offers" className="relative">
      <div className="relative h-[540px] overflow-hidden bg-black sm:h-[600px] lg:h-[640px]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              <picture className="block h-full w-full">
                {banner.mobileImageUrl ? (
                  <source
                    media="(max-width: 768px)"
                    srcSet={banner.mobileImageUrl}
                  />
                ) : null}
                <img
                  src={banner.imageUrl ?? ""}
                  alt=""
                  className="h-full w-full scale-125 object-cover blur-2xl"
                />
              </picture>
            </div>
            <div className="absolute inset-0 mx-auto max-w-[88rem] px-4 lg:px-8">
              <BannerLink
                banner={banner}
                className="relative block h-full w-full overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-fill"
              >
                <BannerImage
                  banner={banner}
                  className="block h-full w-full"
                  imgClassName="h-full w-full object-fill"
                />
              </BannerLink>
            </div>
          </div>
        ))}

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => handleNav(index - 1)}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:grid"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="h-5 w-5"
              >
                <path
                  d="m15 18-6-6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleNav(index + 1)}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:grid"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="h-5 w-5"
              >
                <path
                  d="m9 6 6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => handleNav(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-8 bg-gold-400"
                      : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function StaticHeroSlider() {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((i: number) => {
    setIndex((i + heroSlides.length) % heroSlides.length);
  }, []);

  const restartAutoplay = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setIndex((v) => (v + 1) % heroSlides.length),
      AUTOPLAY_MS,
    );
  }, []);

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [restartAutoplay]);

  function handleNav(i: number) {
    goTo(i);
    restartAutoplay();
  }

  return (
    <section aria-label="Special offers" className="relative">
      <div className="relative h-[480px] overflow-hidden sm:h-[440px]">
        {heroSlides.map((slide, i) => (
          <article
            key={slide.id}
            className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-700 ease-out ${
              i === index
                ? "translate-x-0 opacity-100"
                : i < index
                  ? "pointer-events-none -translate-x-8 opacity-0"
                  : "pointer-events-none translate-x-8 opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />

            <div className="relative mx-auto flex h-full max-w-7xl flex-col-reverse items-center justify-center gap-6 px-6 sm:flex-row sm:justify-between sm:gap-10 lg:px-12">
              <div className="max-w-xl pb-10 text-center sm:pb-0 sm:text-left">
                <p className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-300 sm:text-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
                  {slide.kicker}
                </p>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
                  {slide.title}{" "}
                  <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                    {slide.highlight}
                  </span>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                  {slide.subtitle}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                  <a
                    href={slide.href}
                    className="rounded-full bg-gold-400 px-7 py-3 text-sm font-bold text-brand-950 shadow-lg shadow-gold-500/30 transition-all hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-gold-400/40"
                  >
                    {slide.cta}
                  </a>
                  <div className="flex items-center gap-3 text-white">
                    <span className="font-display text-2xl font-extrabold text-gold-300">
                      {slide.stat.value}
                    </span>
                    <span className="text-left text-xs uppercase tracking-wider leading-tight text-white/60">
                      {slide.stat.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative shrink-0 pt-8 sm:pt-0">
                <div className="absolute inset-0 scale-125 rounded-full bg-white/5 blur-2xl" />
                <ApplianceArt
                  kind={slide.art}
                  className="animate-float relative h-36 w-36 text-white/90 drop-shadow-2xl sm:h-64 sm:w-64"
                />
              </div>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={() => handleNav(index - 1)}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:grid"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-5 w-5"
          >
            <path
              d="m15 18-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleNav(index + 1)}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:grid"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-5 w-5"
          >
            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {heroSlides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => handleNav(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-gold-400" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
