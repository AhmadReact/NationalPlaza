"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  resolveCategoryFiltersId,
  toCardProduct,
  useGetStoreCategoryBySlugQuery,
  useGetStoreCategoryFiltersQuery,
  useGetStoreProductsQuery,
} from "@/app/store/customerAPI";
import { CollectionFilters } from "@/components/collection-filters";
import { ProductCard } from "@/components/product-card";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import {
  catalogStateToApiParams,
  catalogStateToSearchParams,
  emptyCatalogQueryState,
  hasActiveCatalogFilters,
  parseCatalogSearchParams,
  type CatalogQueryState,
} from "@/lib/catalog-query";

const PAGE_SIZE = 20;

export function CollectionClient({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const state = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams],
  );

  const {
    data: categoryResult,
    isLoading: categoryLoading,
    isError: categoryError,
    error: categoryErr,
  } = useGetStoreCategoryBySlugQuery(slug);

  const category = categoryResult?.data;
  const filterQuery = catalogStateToApiParams(state, { status: "ACTIVE" });

  const {
    data: filtersResult,
    isFetching: filtersFetching,
  } = useGetStoreCategoryFiltersQuery(
    {
      slug,
      status: "ACTIVE",
      brandId: filterQuery.brandId,
      minPrice: filterQuery.minPrice,
      maxPrice: filterQuery.maxPrice,
      inStock: filterQuery.inStock,
      attrs: filterQuery.attrs,
    },
    { skip: !category },
  );

  const filtersData = filtersResult?.data;
  const categoryId = resolveCategoryFiltersId(filtersData) ?? category?.id;

  const {
    data: productsResult,
    isLoading: productsLoading,
    isFetching: productsFetching,
    isError: productsError,
    error: productsErr,
  } = useGetStoreProductsQuery(
    {
      ...catalogStateToApiParams(state, {
        categoryId,
        status: "ACTIVE",
        limit: PAGE_SIZE,
      }),
    },
    { skip: !categoryId },
  );

  function applyState(next: CatalogQueryState) {
    const query = catalogStateToSearchParams(next).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (categoryLoading) {
    return <CollectionSkeleton />;
  }

  if (categoryError || !category) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {getFetchErrorMessage(
            categoryErr as { status?: number | string; data?: unknown; error?: string },
            "Category not found.",
          )}
        </p>
      </div>
    );
  }

  const products = productsResult?.data ?? [];
  const meta = productsResult?.meta;
  const cards = products.map(toCardProduct);
  const filters = filtersData?.filters ?? [];
  const hasFilters = filters.length > 0 || Boolean(filtersData?.price);
  const busy = productsFetching || filtersFetching;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-slate-500"
      >
        <Link href="/" className="font-medium hover:text-brand-700">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/categories" className="font-medium hover:text-brand-700">
          Categories
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-brand-950">{category.name}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
            {category.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {meta
              ? `${meta.total} product${meta.total === 1 ? "" : "s"}`
              : "Shop this collection"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveCatalogFilters(state) ? (
            <button
              type="button"
              onClick={() => applyState(emptyCatalogQueryState())}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              Clear filters
            </button>
          ) : null}
          {hasFilters ? (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white lg:hidden"
            >
              Filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {hasFilters ? (
          <aside className="hidden lg:block">
            <div className="sticky top-36 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-bold text-brand-950">
                Filters
              </h2>
              <div className="mt-4">
                <CollectionFilters
                  filters={filters}
                  price={filtersData?.price}
                  state={state}
                  onChange={applyState}
                />
              </div>
            </div>
          </aside>
        ) : null}

        <div>
          {productsError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
              {getFetchErrorMessage(
                productsErr as {
                  status?: number | string;
                  data?: unknown;
                  error?: string;
                },
                "Failed to load products.",
              )}
            </p>
          ) : productsLoading && cards.length === 0 ? (
            <ProductGridSkeleton />
          ) : cards.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No products match these filters.
            </p>
          ) : (
            <div
              className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 ${
                busy ? "opacity-70" : ""
              }`}
            >
              {cards.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={!meta.hasPreviousPage}
                onClick={() =>
                  applyState({ ...state, page: Math.max(1, state.page - 1) })
                }
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => applyState({ ...state, page: state.page + 1 })}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {filtersOpen && hasFilters ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-brand-950/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-brand-950">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Done
              </button>
            </div>
            <CollectionFilters
              filters={filters}
              price={filtersData?.price}
              state={state}
              onChange={(next) => {
                applyState(next);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CollectionSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="hidden h-96 animate-pulse rounded-2xl bg-slate-100 lg:block" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}
