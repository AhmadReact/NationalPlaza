"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  toCardProduct,
  useGetStoreProductsQuery,
  useLazyGetStoreProductsQuery,
  type PaginationMeta,
  type StoreProduct,
  type StoreProductListParams,
} from "@/app/store/customerAPI";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { toCatalogQueryString } from "@/lib/catalog-query";

function mergeProducts(
  current: StoreProduct[],
  incoming: StoreProduct[],
): StoreProduct[] {
  const seen = new Set(current.map((product) => product.id));
  const next = [...current];
  for (const product of incoming) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    next.push(product);
  }
  return next;
}

export function useInfiniteStoreProducts({
  params,
  skip = false,
  initialProducts = [],
  initialMeta = null,
  useInitial = false,
}: {
  params: StoreProductListParams;
  skip?: boolean;
  initialProducts?: StoreProduct[];
  initialMeta?: PaginationMeta | null;
  useInitial?: boolean;
}) {
  const filterKey = toCatalogQueryString({ ...params, page: 1 });
  const [extra, setExtra] = useState<StoreProduct[]>([]);
  const [nextPage, setNextPage] = useState(2);
  const [tailHasMore, setTailHasMore] = useState<boolean | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const generation = useRef(0);
  const inFlight = useRef(false);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const firstPage = useGetStoreProductsQuery(
    { ...params, page: 1 },
    { skip },
  );
  const [fetchMore] = useLazyGetStoreProductsQuery();

  useEffect(() => {
    generation.current += 1;
    inFlight.current = false;
    setExtra([]);
    setNextPage(2);
    setTailHasMore(null);
    setLoadingMore(false);
    setLoadError(null);
  }, [filterKey]);

  const firstProducts =
    firstPage.data?.data ?? (useInitial ? initialProducts : []);
  const meta =
    firstPage.data?.meta ?? (useInitial ? initialMeta : null);
  const hasMore = tailHasMore ?? Boolean(meta?.hasNextPage);
  const products = useMemo(
    () => mergeProducts(firstProducts, extra),
    [firstProducts, extra],
  );

  const loadMore = useCallback(async () => {
    if (skip || inFlight.current || !hasMore) return;

    const requestGen = generation.current;
    const pageToLoad = nextPage;
    inFlight.current = true;
    setLoadingMore(true);
    setLoadError(null);

    try {
      const result = await fetchMore({
        ...paramsRef.current,
        page: pageToLoad,
      }).unwrap();
      if (requestGen !== generation.current) return;

      setExtra((current) => mergeProducts(current, result.data ?? []));
      setTailHasMore(Boolean(result.meta?.hasNextPage));
      setNextPage(pageToLoad + 1);
    } catch (error) {
      if (requestGen !== generation.current) return;
      setLoadError(
        getFetchErrorMessage(
          error as {
            status?: number | string;
            data?: unknown;
            error?: string;
          },
          "Could not load more products.",
        ),
      );
    } finally {
      if (requestGen === generation.current) {
        inFlight.current = false;
        setLoadingMore(false);
      }
    }
  }, [fetchMore, hasMore, nextPage, skip]);

  return {
    products,
    cards: products.map(toCardProduct),
    meta,
    hasMore,
    loadingMore,
    loadError,
    loadMore,
    isLoading: firstPage.isLoading,
    isFetching: firstPage.isFetching,
    isError: firstPage.isError,
    error: firstPage.error,
  };
}

export function InfiniteScrollSentinel({
  hasMore,
  loading,
  error,
  onLoadMore,
  disabled = false,
}: {
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  disabled?: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading || disabled || error) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root: null, rootMargin: "800px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, error, hasMore, loading, onLoadMore]);

  if (disabled) return null;

  if (error) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={onLoadMore}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8 flex flex-col gap-4" aria-busy="true">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
        <p className="text-center text-sm text-slate-500" aria-live="polite">
          Loading more products…
        </p>
      </div>
    );
  }

  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onLoadMore}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
      >
        Load more products
      </button>
    </div>
  );
}

export function InfiniteProductGrid({
  cards,
  replacing = false,
}: {
  cards: ReturnType<typeof toCardProduct>[];
  replacing?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 ${
        replacing ? "opacity-70" : ""
      }`}
    >
      {cards.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
