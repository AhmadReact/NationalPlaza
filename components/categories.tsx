"use client";

import Link from "next/link";
import { useLiveHomePage } from "@/app/store/useLiveHomePage";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";

export function Categories() {
  const { data, isLoading, isError, error } = useLiveHomePage();
  const categories = data?.data?.categories ?? [];

  if (isLoading && categories.length === 0) {
    return (
      <section id="categories" className="scroll-mt-32 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto h-8 w-56 animate-pulse rounded bg-slate-200" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section id="categories" className="scroll-mt-32 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
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
              href={category.href || `/categories/${category.slug}`}
              className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/10"
            >
              {category.image ? (
                <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-slate-100 transition-all duration-300 group-hover:from-brand-900 group-hover:to-brand-700 group-hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={category.image}
                    alt=""
                    className="h-10 w-10 object-contain"
                  />
                </span>
              ) : null}
              <h3 className="mt-3 text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-800">
                {category.name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">View products</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
