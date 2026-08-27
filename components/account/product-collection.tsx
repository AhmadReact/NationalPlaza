"use client";

import Link from "next/link";
import { toCardProduct } from "@/app/store/customerAPI";
import {
  getAccountProductId,
  unwrapAccountProducts,
} from "@/app/store/accountAPI";
import { ProductCard } from "@/components/product-card";

export function AccountProductGrid({
  title,
  subtitle,
  emptyTitle,
  emptyHref = "/",
  emptyLabel = "Continue shopping",
  items,
  loading,
  onClear,
  clearLabel,
  onRemove,
  removeLabel = "Remove",
}: {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyHref?: string;
  emptyLabel?: string;
  items: unknown[] | undefined;
  loading?: boolean;
  onClear?: () => void;
  clearLabel?: string;
  onRemove?: (productId: string) => void;
  removeLabel?: string;
}) {
  const products = unwrapAccountProducts(items);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-brand-400" />
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-950">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {products.length > 0 && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-semibold text-slate-500 underline-offset-2 hover:text-red-600 hover:underline"
          >
            {clearLabel ?? "Clear all"}
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Loading…</p>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-600">{emptyTitle}</p>
          <Link
            href={emptyHref}
            className="mt-6 inline-flex rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            {emptyLabel}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => {
            const productId =
              getAccountProductId(items?.[index]) ?? product.id;
            return (
              <div key={`${product.id}-${index}`} className="relative">
                {onRemove ? (
                  <button
                    type="button"
                    onClick={() => onRemove(productId)}
                    className="absolute right-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-600 shadow hover:text-red-600"
                  >
                    {removeLabel}
                  </button>
                ) : null}
                <ProductCard
                  product={toCardProduct(product)}
                  showWishlist={!onRemove}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
