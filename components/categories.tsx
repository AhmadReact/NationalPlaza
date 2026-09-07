"use client";

import Link from "next/link";
import { useLiveHomePage } from "@/app/store/useLiveHomePage";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";

export function Categories() {
  const { data, isLoading, isError, error } = useLiveHomePage();
  const categories = data?.data?.categories ?? [];

  if (isLoading && categories.length === 0) {
    return (
      <section id="categories" className="scroll-mt-32 py-5 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto h-6 w-36 animate-pulse rounded bg-slate-200 sm:h-8 sm:w-56" />
          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100 sm:h-36 sm:rounded-2xl"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section id="categories" className="scroll-mt-32 py-5 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-pretty text-red-700">
            {getFetchErrorMessage(
              error as {
                status?: number | string;
                data?: unknown;
                error?: string;
              },
              "Failed to load the homepage.",
            )}
          </p>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section id="categories" className="scroll-mt-32 py-5 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-center sm:text-center">
          <div>
            <span className="hidden h-1.5 w-16 rounded-full bg-gradient-to-r from-gold-500 to-gold-300 sm:mx-auto sm:block" />
            <h2 className="font-display text-lg font-extrabold tracking-tight text-balance text-brand-950 sm:mt-3 sm:text-3xl">
              Shop by Category
            </h2>
            <p className="mt-2 hidden text-sm text-pretty text-slate-500 sm:block">
              Filter by brand, price, stock, and category-specific attributes
            </p>
          </div>
          <Link
            href="/categories"
            className={`shrink-0 text-xs font-semibold text-brand-700 sm:hidden ${
              categories.length > 6 ? "" : "hidden"
            }`}
          >
            View all
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={category.href || `/categories/${category.slug}`}
              className={`group flex flex-col items-center rounded-xl border border-slate-200 bg-white px-1.5 py-2.5 text-center shadow-sm transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/10 sm:rounded-2xl sm:p-5 sm:hover:-translate-y-1 ${
                index >= 6 ? "hidden sm:flex" : ""
              }`}
            >
              {category.image ? (
                <span className="grid size-9 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-brand-50 to-slate-100 transition-all duration-300 group-hover:scale-105 group-hover:from-brand-900 group-hover:to-brand-700 sm:size-16 sm:rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={category.image}
                    alt=""
                    className="size-6 object-contain sm:size-10"
                  />
                </span>
              ) : null}
              <h3 className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-snug text-slate-800 transition-colors group-hover:text-brand-800 sm:mt-3 sm:text-sm">
                {category.name}
              </h3>
              <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">View products</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
