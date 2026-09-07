"use client";

import Link from "next/link";
import { formatPrice, type Product } from "@/lib/data";
import { AddToCartButton } from "./add-to-cart-button";
import { ApplianceArt } from "./appliance-art";
import { WishlistButton } from "./wishlist-button";

export function ProductCardSkeleton() {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white sm:rounded-2xl">
      <div className="aspect-square animate-pulse bg-slate-100" />
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200 sm:h-3 sm:w-16" />
        <div className="mt-1.5 h-3.5 w-full animate-pulse rounded bg-slate-200 sm:h-4" />
        <div className="mt-1 h-3.5 w-2/3 animate-pulse rounded bg-slate-200 sm:h-4" />
        <div className="mt-auto pt-2.5 sm:pt-3">
          <div className="h-5 w-16 animate-pulse rounded bg-slate-200 sm:h-6 sm:w-24" />
          <div className="mt-2 h-8 w-full animate-pulse rounded-lg bg-slate-200 sm:mt-3 sm:h-10 sm:rounded-xl" />
        </div>
      </div>
    </article>
  );
}

export function ProductCard({
  product,
  showWishlist = true,
}: {
  product: Product;
  showWishlist?: boolean;
}) {
  const href = product.href || `/products/${product.slug || product.id}`;
  const cartProductId = product.productId || product.id;
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const discount =
    product.price && product.oldPrice
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : null;

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-300 sm:rounded-2xl sm:hover:-translate-y-1.5 sm:hover:border-brand-200 sm:hover:shadow-xl sm:hover:shadow-brand-900/10 sm:transition-all">
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br ${product.tint}`}
      >
        <Link
          href={href}
          aria-label={product.name}
          className="absolute inset-0"
        />
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            className="h-full w-full object-contain object-center p-3 sm:p-6 lg:p-8"
          />
        ) : (
          <ApplianceArt
            kind={product.art}
            className="h-16 w-16 text-brand-900/70 transition-transform duration-500 group-hover:scale-110 sm:h-28 sm:w-28"
          />
        )}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {product.onSale ? (
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow sm:px-2.5 sm:py-1 sm:text-[11px]">
              Sale
            </span>
          ) : null}
          {discount !== null ? (
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow sm:px-2.5 sm:py-1 sm:text-[11px]">
              -{discount}%
            </span>
          ) : null}
          {product.badge ? (
            <span className="max-w-[7.5rem] truncate rounded-full bg-brand-950 px-1.5 py-0.5 text-[10px] font-semibold text-gold-300 shadow sm:max-w-none sm:px-2.5 sm:py-1 sm:text-[11px]">
              {product.badge}
            </span>
          ) : null}
        </div>
        {showWishlist ? (
          <WishlistButton
            productId={cartProductId}
            className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-white/95 text-slate-500 shadow sm:right-3 sm:top-3 sm:size-9 sm:bg-white/90 sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:opacity-100 sm:hover:scale-110 sm:hover:text-red-500 aria-pressed:opacity-100 aria-pressed:text-red-500"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-brand-600 sm:text-[11px]">
          {product.brand}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-balance text-slate-800 transition-colors group-hover:text-brand-800 sm:mt-1.5 sm:text-sm">
          <Link href={href}>{product.name}</Link>
        </h3>

        {product.reviews > 0 ? (
          <div className="mt-1.5 hidden items-center gap-1.5 sm:mt-2 sm:flex">
            <Stars rating={product.rating} />
            <span className="text-xs text-slate-400">({product.reviews})</span>
          </div>
        ) : null}

        <div className="mt-auto pt-2 sm:pt-3">
          {product.price ? (
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="font-display text-[15px] font-extrabold tabular-nums text-brand-950 sm:text-lg">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-[11px] tabular-nums text-slate-400 line-through sm:text-xs">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>
          ) : (
            <span className="font-display text-xs font-bold text-gold-600 sm:text-sm">
              Inquire For Price
            </span>
          )}

          <AddToCartButton
            productId={cartProductId}
            disabled={outOfStock}
            idleLabel={
              <>
                <span className="sm:hidden">
                  {outOfStock ? "Sold out" : "Add"}
                </span>
                <span className="hidden sm:inline">
                  {outOfStock ? "Out of stock" : "Add to Cart"}
                </span>
              </>
            }
            successLabel={
              <>
                <span className="sm:hidden">Added</span>
                <span className="hidden sm:inline">✓ Added to Cart</span>
              </>
            }
            className="mt-2 w-full rounded-lg bg-brand-900 py-2 text-xs font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-3 sm:rounded-xl sm:py-2.5 sm:text-sm"
          />
        </div>
      </div>
    </article>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex text-gold-500"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-3.5">
          <defs>
            <linearGradient id={`half-${i}-${rating}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <path
            fill={
              rating >= i
                ? "currentColor"
                : rating >= i - 0.5
                  ? `url(#half-${i}-${rating})`
                  : "#e2e8f0"
            }
            d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z"
          />
        </svg>
      ))}
    </span>
  );
}
