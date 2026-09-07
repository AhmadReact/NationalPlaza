import Link from "next/link";
import type { Product } from "@/lib/data";
import { ProductCard } from "./product-card";

export function ProductSection({
  id,
  title,
  tagline,
  products,
  href,
  accent = "brand",
}: {
  id: string;
  title: string;
  tagline?: string;
  products: Product[];
  href?: string | null;
  accent?: "brand" | "teal" | "emerald" | "violet";
}) {
  const accentBar = {
    brand: "from-brand-600 to-brand-400",
    teal: "from-teal-600 to-cyan-400",
    emerald: "from-emerald-600 to-emerald-400",
    violet: "from-violet-600 to-purple-400",
  }[accent];

  return (
    <section id={id} className="scroll-mt-32 py-8 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className={`block h-1.5 w-12 rounded-full bg-gradient-to-r sm:w-16 ${accentBar}`} />
            <h2 className="mt-2.5 font-display text-xl font-extrabold tracking-tight text-balance text-brand-950 sm:mt-3 sm:text-3xl">
              {title}
            </h2>
            {tagline ? (
              <p className="mt-1 text-sm text-pretty text-slate-500">{tagline}</p>
            ) : null}
          </div>
          {href ? (
            <Link
              href={href}
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-900/15 px-3 py-1.5 text-xs font-semibold text-brand-900 transition-colors hover:border-brand-700 hover:bg-brand-900 hover:text-white sm:gap-2 sm:border-2 sm:px-5 sm:py-2 sm:text-sm"
            >
              View All
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5 transition-transform group-hover:translate-x-1 sm:size-4">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
