"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { heroSlides } from "@/lib/data";
import { ApplianceArt } from "./appliance-art";

const AUTOPLAY_MS = 5000;

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((i: number) => {
    setIndex((i + heroSlides.length) % heroSlides.length);
  }, []);

  const restartAutoplay = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setIndex((v) => (v + 1) % heroSlides.length),
      AUTOPLAY_MS
    );
  }, []);

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [restartAutoplay]);

  const handleNav = (i: number) => {
    goTo(i);
    restartAutoplay();
  };

  return (
    <section aria-label="Special offers" className="relative">
      <div className="relative h-[480px] sm:h-[440px] overflow-hidden">
        {heroSlides.map((slide, i) => (
          <article
            key={slide.id}
            className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-700 ease-out ${
              i === index
                ? "opacity-100 translate-x-0"
                : i < index
                  ? "opacity-0 -translate-x-8 pointer-events-none"
                  : "opacity-0 translate-x-8 pointer-events-none"
            }`}
            aria-hidden={i !== index}
          >
            {/* decorative grid + glow */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />

            <div className="relative mx-auto flex h-full max-w-7xl flex-col-reverse items-center justify-center gap-6 px-6 sm:flex-row sm:justify-between sm:gap-10 lg:px-12">
              <div className="max-w-xl text-center sm:text-left pb-10 sm:pb-0">
                <p className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-widest text-gold-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
                  {slide.kicker}
                </p>
                <h2 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold leading-tight text-white">
                  {slide.title}{" "}
                  <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                    {slide.highlight}
                  </span>
                </h2>
                <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed">
                  {slide.subtitle}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                  <a
                    href={slide.href}
                    className="rounded-full bg-gold-400 px-7 py-3 text-sm font-bold text-brand-950 shadow-lg shadow-gold-500/30 hover:bg-gold-300 hover:shadow-gold-400/40 transition-all hover:-translate-y-0.5"
                  >
                    {slide.cta}
                  </a>
                  <div className="flex items-center gap-3 text-white">
                    <span className="font-display text-2xl font-extrabold text-gold-300">
                      {slide.stat.value}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-white/60 leading-tight text-left">
                      {slide.stat.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative shrink-0 pt-8 sm:pt-0">
                <div className="absolute inset-0 scale-125 rounded-full bg-white/5 blur-2xl" />
                <ApplianceArt
                  kind={slide.art}
                  className="relative h-36 w-36 sm:h-64 sm:w-64 text-white/90 animate-float drop-shadow-2xl"
                />
              </div>
            </div>
          </article>
        ))}

        {/* arrows */}
        <button
          onClick={() => handleNav(index - 1)}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/25 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => handleNav(index + 1)}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/25 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* dots */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {heroSlides.map((slide, i) => (
            <button
              key={slide.id}
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
