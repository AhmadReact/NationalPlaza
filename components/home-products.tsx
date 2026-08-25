"use client";

import { toHomeCardProduct } from "@/app/store/customerAPI";
import { useLiveHomePage } from "@/app/store/useLiveHomePage";
import { ProductSection } from "@/components/product-section";

const ACCENTS = ["brand", "emerald", "teal", "violet"] as const;

export function HomeProducts() {
  const { data, isLoading, isError } = useLiveHomePage();
  const sections = data?.data?.sections ?? [];

  if (isLoading && sections.length === 0) {
    return (
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError || sections.length === 0) return null;

  return (
    <>
      {sections.map((section, index) => (
        <ProductSection
          key={section.id}
          id={section.id}
          title={section.title}
          products={section.products.map(toHomeCardProduct)}
          href={section.href}
          accent={ACCENTS[index % ACCENTS.length]}
        />
      ))}
    </>
  );
}
