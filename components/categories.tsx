"use client";

import Link from "next/link";
import { getArtKindForSlug, useGetStoreCategoryTreeQuery } from "@/app/store/customerAPI";
import { ApplianceArt } from "./appliance-art";

export function Categories() {
  const { data } = useGetStoreCategoryTreeQuery();
  const categories = (data?.data ?? []).filter(
    (category) => category.isActive !== false,
  );

  return (
    <section id="categories" className="scroll-mt-32 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <span className="mx-auto block h-1.5 w-16 rounded-full bg-gradient-to-r from-gold-500 to-gold-300" />
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-950">
            Shop by Category
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Filter by brand, price, stock, and category-specific attributes
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/10"
            >
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-slate-100 text-brand-800 transition-all duration-300 group-hover:from-brand-900 group-hover:to-brand-700 group-hover:text-gold-300 group-hover:scale-105">
                <ApplianceArt
                  kind={getArtKindForSlug(category.slug)}
                  className="h-9 w-9"
                />
              </span>
              <h3 className="mt-3 text-sm font-bold text-slate-800 group-hover:text-brand-800 transition-colors">
                {category.name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">View collection</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
