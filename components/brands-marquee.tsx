import { brands } from "@/lib/data";

export function BrandsMarquee() {
  return (
    <section className="border-y border-slate-200 bg-white py-6 overflow-hidden">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
        Authorized dealer of Pakistan&apos;s leading brands
      </p>
      <div className="relative mt-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
        <div className="flex w-max animate-marquee items-center gap-12 px-6">
          {[...brands, ...brands].map((brand, i) => (
            <span
              key={`${brand}-${i}`}
              className="font-display text-xl font-bold text-slate-300 transition-colors hover:text-brand-800 whitespace-nowrap"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
