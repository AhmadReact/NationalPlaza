"use client";

import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import {
  toCardProduct,
  useGetStoreProductsQuery,
  type StoreProduct,
} from "@/app/store/customerAPI";
import { ProductSection } from "@/components/product-section";

const ACCENTS = ["brand", "emerald", "teal", "violet"] as const;

type CategorySection = {
  id: string;
  title: string;
  tagline: string;
  products: ReturnType<typeof toCardProduct>[];
  accent: (typeof ACCENTS)[number];
};

function groupByCategory(products: StoreProduct[]): CategorySection[] {
  const map = new Map<
    string,
    { title: string; products: StoreProduct[] }
  >();

  for (const product of products) {
    const key = product.category?.slug || product.category?.id || "products";
    const title = product.category?.name || "Products";
    const existing = map.get(key);
    if (existing) {
      existing.products.push(product);
    } else {
      map.set(key, { title, products: [product] });
    }
  }

  return Array.from(map.entries()).map(([id, group], index) => ({
    id,
    title: group.title,
    tagline: `Shop ${group.title.toLowerCase()} from trusted brands`,
    products: group.products.slice(0, 4).map(toCardProduct),
    accent: ACCENTS[index % ACCENTS.length],
  }));
}

export function HomeProducts() {
  const { data, isLoading, isError, error } = useGetStoreProductsQuery({
    page: 1,
    limit: 24,
  });

  if (isLoading) {
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

  if (isError) {
    return (
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
            {getFetchErrorMessage(
              error as { status?: number | string; data?: unknown; error?: string },
              "Failed to load products.",
            )}
          </p>
        </div>
      </section>
    );
  }

  const apiProducts = data?.data ?? [];
  if (apiProducts.length === 0) {
    return (
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            No products available yet. Check back soon.
          </p>
        </div>
      </section>
    );
  }

  const sections = groupByCategory(apiProducts);

  return (
    <>
      {sections.map((section) => (
        <ProductSection
          key={section.id}
          id={section.id}
          title={section.title}
          tagline={section.tagline}
          products={section.products}
          accent={section.accent}
        />
      ))}
    </>
  );
}
