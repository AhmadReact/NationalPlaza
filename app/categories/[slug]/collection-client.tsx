"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  Category,
  CategoryFiltersData,
} from "@/app/admin/(panel)/categories/store/categoryAPI";
import {
  resolveCategoryFiltersId,
  useGetStoreCategoryBySlugQuery,
  useGetStoreCategoryFiltersQuery,
  type PaginationMeta,
  type StoreProduct,
} from "@/app/store/customerAPI";
import { CollectionFilters } from "@/components/collection-filters";
import { CategoryBanners } from "@/components/storefront-banners";
import { ProductCardSkeleton } from "@/components/product-card";
import {
  InfiniteProductGrid,
  InfiniteScrollSentinel,
  useInfiniteStoreProducts,
} from "@/components/infinite-products";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import {
  catalogStateToApiParams,
  catalogStateToSearchParams,
  catalogStatesEqual,
  COLLECTION_PAGE_SIZE,
  emptyCatalogQueryState,
  activeCatalogFilterCount,
  parseCatalogSearchParams,
  type CatalogQueryState,
} from "@/lib/catalog-query";

export type CollectionClientProps = {
  slug: string;
  initialCategory: Category;
  initialProducts: StoreProduct[];
  initialMeta: PaginationMeta | null;
  initialFilters: CategoryFiltersData | null;
  initialState: CatalogQueryState;
};

export function CollectionClient(props: CollectionClientProps) {
  return (
    <Suspense
      fallback={
        <CollectionView {...props} state={props.initialState} />
      }
    >
      <CollectionWithSearchParams {...props} />
    </Suspense>
  );
}

function CollectionWithSearchParams(props: CollectionClientProps) {
  const searchParams = useSearchParams();
  const state = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams],
  );

  return <CollectionView {...props} state={state} />;
}

function CollectionView({
  slug,
  initialCategory,
  initialProducts,
  initialMeta,
  initialFilters,
  initialState,
  state,
}: CollectionClientProps & { state: CatalogQueryState }) {
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterState = { ...state, page: 1 };
  const useServerSnapshot = catalogStatesEqual(filterState, {
    ...initialState,
    page: 1,
  });

  const {
    data: categoryResult,
    isLoading: categoryLoading,
    isError: categoryError,
    error: categoryErr,
  } = useGetStoreCategoryBySlugQuery(slug);

  const category = categoryResult?.data ?? initialCategory;
  const filterQuery = catalogStateToApiParams(state, { status: "ACTIVE" });

  const {
    data: filtersResult,
  } = useGetStoreCategoryFiltersQuery(
    {
      slug,
      status: "ACTIVE",
      brandId: filterQuery.brandId,
      inStock: filterQuery.inStock,
      attrs: filterQuery.attrs,
    },
    { skip: !category },
  );

  const filtersData =
    filtersResult?.data ?? (useServerSnapshot ? initialFilters : null);
  const categoryId = resolveCategoryFiltersId(filtersData) ?? category?.id;

  const {
    cards,
    meta,
    hasMore,
    loadingMore,
    loadError,
    loadMore,
    isLoading: productsLoading,
    isFetching: productsFetching,
    isError: productsError,
    error: productsErr,
  } = useInfiniteStoreProducts({
    params: catalogStateToApiParams(filterState, {
      categoryId,
      status: "ACTIVE",
      limit: COLLECTION_PAGE_SIZE,
    }),
    skip: !categoryId,
    initialProducts,
    initialMeta,
    useInitial: useServerSnapshot,
  });

  function applyState(next: CatalogQueryState) {
    const query = catalogStateToSearchParams({ ...next, page: 1 }).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (!category) {
    if (categoryLoading) {
      return <CollectionSkeleton />;
    }

    if (categoryError) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-16">
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
            {getFetchErrorMessage(
              categoryErr as {
                status?: number | string;
                data?: unknown;
                error?: string;
              },
              "Category not found.",
            )}
          </p>
        </div>
      );
    }

    return null;
  }

  const filters = filtersData?.filters ?? [];
  const hasFilters = filters.length > 0 || Boolean(filtersData?.price);
  const showProductSkeleton =
    productsLoading &&
    cards.length === 0 &&
    !(useServerSnapshot && initialMeta != null);
  const replacing = productsFetching && !loadingMore;
  const activeFilterCount = activeCatalogFilterCount(state);
  const filtersActive = activeFilterCount > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:py-10 lg:pb-10">
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
        <div className="hidden items-center gap-2 lg:flex">
          {filtersActive ? (
            <button
              type="button"
              onClick={() => applyState(emptyCatalogQueryState())}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <CategoryBanners categoryId={category.id} />

      <div
        className={`mt-8 grid gap-8 ${
          hasFilters ? "lg:grid-cols-[260px_minmax(0,1fr)]" : ""
        }`}
      >
        {hasFilters ? (
          <aside className="hidden lg:block">
            <div className="sticky top-36 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-bold text-brand-950">
                Filters
              </h2>
              <div className="mt-4">
                <CollectionFilters
                  key={slug}
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
          ) : showProductSkeleton ? (
            <ProductGridSkeleton />
          ) : cards.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No products match these filters.
            </p>
          ) : (
            <>
              <InfiniteProductGrid cards={cards} replacing={replacing} />
              <InfiniteScrollSentinel
                hasMore={hasMore}
                loading={loadingMore}
                error={loadError}
                onLoadMore={loadMore}
              />
            </>
          )}
        </div>
      </div>

      {hasFilters && !filtersOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl gap-2">
            {filtersActive ? (
              <button
                type="button"
                onClick={() => applyState(emptyCatalogQueryState())}
                className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-900 hover:bg-brand-50"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="mobile-collection-filters"
              onClick={() => setFiltersOpen(true)}
              className="relative flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-900 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Filters
              {filtersActive ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-gold-400 px-1.5 text-[11px] font-bold text-brand-950">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      ) : null}

      {filtersOpen && hasFilters ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-brand-950/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div
            id="mobile-collection-filters"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl"
          >
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
              key={`${slug}-mobile`}
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="hidden min-h-112 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 lg:block" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
