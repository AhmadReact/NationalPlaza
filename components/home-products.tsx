"use client";

import { toHomeCardProduct } from "@/app/store/customerAPI";
import { useLiveHomePage } from "@/app/store/useLiveHomePage";
import { ProductCardSkeleton } from "@/components/product-card";
import { ProductSection } from "@/components/product-section";

const ACCENTS = ["brand", "emerald", "teal", "violet"] as const;

export function HomeProducts() {
  const { data, isLoading, isError } = useLiveHomePage();
  const sections = data?.data?.sections ?? [];

  if (isLoading && sections.length === 0) {
    return (
      <section className="py-8 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-7 w-40 animate-pulse rounded bg-slate-200 sm:h-8 sm:w-48" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
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
