"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  toCardProduct,
  useGetStoreProductsQuery,
} from "@/app/store/customerAPI";
import { ProductCard } from "@/components/product-card";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";

const PAGE_SIZE = 20;

function searchHref(query: string, page: number) {
  const params = new URLSearchParams();
  params.set("q", query);
  if (page > 1) params.set("page", String(page));
  return `/search?${params.toString()}`;
}

export function SearchResults({
  query,
  page,
}: {
  query: string;
  page: number;
}) {
  const router = useRouter();
  const skip = query.length === 0;

  const {
    data: productsResult,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetStoreProductsQuery(
    {
      search: query,
      status: "ACTIVE",
      page,
      limit: PAGE_SIZE,
    },
    { skip },
  );

  const products = productsResult?.data ?? [];
  const meta = productsResult?.meta;
  const cards = products.map(toCardProduct);

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
        <span className="font-semibold text-brand-950">Search</span>
      </nav>

      <div className="mt-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
          {query ? `Results for “${query}”` : "Search products"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {skip
            ? "Type a product, brand, or category in the search bar."
            : meta
              ? `${meta.total} product${meta.total === 1 ? "" : "s"}`
              : "Searching the catalog"}
        </p>
      </div>

      <div className="mt-8">
        {skip ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Enter a search term to find air conditioners, refrigerators, TVs, and
            more.
          </p>
        ) : isError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
            {getFetchErrorMessage(
              error as {
                status?: number | string;
                data?: unknown;
                error?: string;
              },
              "Failed to search products.",
            )}
          </p>
        ) : isLoading && cards.length === 0 ? (
          <ProductGridSkeleton />
        ) : cards.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No products matched “{query}”. Try a brand name or a shorter term.
          </p>
        ) : (
          <div
            className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 ${
              isFetching ? "opacity-70" : ""
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
                router.push(searchHref(query, Math.max(1, page - 1)))
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
              onClick={() => router.push(searchHref(query, page + 1))}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
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
