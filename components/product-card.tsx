"use client";

import Link from "next/link";
import { formatPrice, type Product } from "@/lib/data";
import { AddToCartButton } from "./add-to-cart-button";
import { ApplianceArt } from "./appliance-art";
import { WishlistButton } from "./wishlist-button";

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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-900/10 hover:border-brand-200">
      <div
        className={`relative aspect-square overflow-hidden bg-gradient-to-br ${product.tint}`}
      >
        <Link href={href} aria-label={product.name} className="absolute inset-0" />
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            className="h-full w-full object-contain object-center p-6 sm:p-8"
          />
        ) : (
          <ApplianceArt
            kind={product.art}
            className="h-28 w-28 text-brand-900/70 transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {product.onSale ? (
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
              Sale
            </span>
          ) : null}
          {discount !== null ? (
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
              -{discount}%
            </span>
          ) : null}
          {product.badge ? (
            <span className="rounded-full bg-brand-950 px-2.5 py-1 text-[11px] font-semibold text-gold-300 shadow">
              {product.badge}
            </span>
          ) : null}
        </div>
        {showWishlist ? (
          <WishlistButton
            productId={cartProductId}
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:text-red-500 aria-[pressed=true]:opacity-100 aria-[pressed=true]:text-red-500"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">
          {product.brand}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-brand-800">
          <Link href={href}>{product.name}</Link>
        </h3>

        {product.reviews > 0 ? (
          <div className="mt-2 flex items-center gap-1.5">
            <Stars rating={product.rating} />
            <span className="text-xs text-slate-400">({product.reviews})</span>
          </div>
        ) : null}

        <div className="mt-auto pt-3">
          {product.price ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-extrabold text-brand-950">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>
          ) : (
            <span className="font-display text-sm font-bold text-gold-600">
              Inquire For Price
            </span>
          )}

          <AddToCartButton
            productId={cartProductId}
            disabled={outOfStock}
            idleLabel={outOfStock ? "Out of stock" : "Add to Cart"}
            className="mt-3 w-full rounded-xl bg-brand-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>
    </article>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex text-gold-500" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5">
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
