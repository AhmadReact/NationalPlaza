import type { Product } from "@/lib/data";
import { ProductCard } from "./product-card";

export function ProductSection({
  id,
  title,
  tagline,
  products,
  accent = "brand",
}: {
  id: string;
  title: string;
  tagline: string;
  products: Product[];
  accent?: "brand" | "teal" | "emerald" | "violet";
}) {
  const accentBar = {
    brand: "from-brand-600 to-brand-400",
    teal: "from-teal-600 to-cyan-400",
    emerald: "from-emerald-600 to-emerald-400",
    violet: "from-violet-600 to-purple-400",
  }[accent];

  return (
    <section id={id} className="scroll-mt-32 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className={`block h-1.5 w-16 rounded-full bg-gradient-to-r ${accentBar}`} />
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-950">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{tagline}</p>
          </div>
          <a
            href="#"
            className="group inline-flex items-center gap-2 rounded-full border-2 border-brand-900/15 px-5 py-2 text-sm font-semibold text-brand-900 transition-colors hover:border-brand-700 hover:bg-brand-900 hover:text-white"
          >
            View All
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 transition-transform group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
