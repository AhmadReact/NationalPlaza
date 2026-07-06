import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getAllProducts, getProductById } from "@/lib/data";
import { getDetailContent } from "@/lib/product-details";
import { DetailTabs } from "@/components/detail-tabs";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { PurchaseActions } from "@/components/purchase-actions";

export function generateStaticParams() {
  return getAllProducts().map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lookup = getProductById(id);
  if (!lookup) return { title: "Product Not Found — National Electronics" };
  return {
    title: `${lookup.product.name} — National Electronics`,
    description: `Buy ${lookup.product.name} at the best price in Pakistan with nationwide delivery from National Electronics, trusted since 1946.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lookup = getProductById(id);
  if (!lookup) notFound();

  const { product, categoryId, categoryName, related } = lookup;
  const detail = getDetailContent(product);
  const discount =
    product.price && product.oldPrice
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : null;

  const priceUpdated = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-slate-200 bg-white">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap"
          >
            <Link href="/" className="hover:text-brand-700 font-medium transition-colors">
              Home
            </Link>
            <Crumb />
            <Link
              href={`/#${categoryId}`}
              className="hover:text-brand-700 font-medium transition-colors"
            >
              {categoryName}
            </Link>
            <Crumb />
            <span className="font-semibold text-brand-950">{product.name}</span>
          </nav>
        </div>

        {/* Product overview */}
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:py-12 lg:grid-cols-2">
          <ProductGallery
            kind={product.art}
            tint={product.tint}
            discount={discount}
            badge={product.badge}
          />

          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700">
                {product.brand}
              </span>
              <span className="text-xs text-slate-400">{categoryName}</span>
            </div>

            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-brand-950">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-2">
              <Stars rating={product.rating} />
              <span className="text-sm text-slate-500">
                {product.rating.toFixed(1)} · {product.reviews}{" "}
                {product.reviews === 1 ? "review" : "reviews"}
              </span>
            </div>

            {/* Price */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {product.price ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950">
                      {formatPrice(product.price)}
                    </span>
                    {product.oldPrice && (
                      <span className="text-base text-slate-400 line-through">
                        {formatPrice(product.oldPrice)}
                      </span>
                    )}
                    {discount !== null && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
                        SAVE {discount}%
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Best price in Pakistan · updated on {priceUpdated}
                  </p>
                </>
              ) : (
                <p className="font-display text-2xl font-extrabold text-gold-600">
                  Inquire For Price
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="font-semibold text-emerald-700">In Stock</span>
                <span className="text-slate-400">— ready to ship nationwide</span>
              </div>
            </div>

            <div className="mt-6">
              <PurchaseActions />
            </div>

            {/* Mini trust badges */}
            <ul className="mt-6 grid grid-cols-2 gap-3 text-xs">
              {[
                "Delivery all across Pakistan",
                "7-day replacement guarantee",
                "Official brand warranty",
                "Cash on delivery available",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold text-slate-600"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 shrink-0 text-gold-600">
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4 pb-4">
          <DetailTabs
            intro={detail.intro}
            features={detail.features}
            specs={detail.specs}
          />
        </div>

        {/* Reviews summary */}
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <h2 className="font-display text-xl font-extrabold text-brand-950">
                  Customer Reviews
                </h2>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-display text-4xl font-extrabold text-brand-950">
                    {product.rating.toFixed(1)}
                  </span>
                  <div>
                    <Stars rating={product.rating} />
                    <p className="mt-0.5 text-xs text-slate-400">
                      Based on {product.reviews}{" "}
                      {product.reviews === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                </div>
              </div>

              <RatingBars rating={product.rating} reviews={product.reviews} />

              <button className="rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700">
                Write a Review
              </button>
            </div>
          </div>
        </section>

        {/* Related products */}
        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-brand-400" />
              <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-brand-950">
                You May Also Like
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                More {categoryName.toLowerCase()} our customers love
              </p>
            </div>
            <Link
              href={`/#${categoryId}`}
              className="shrink-0 rounded-full border-2 border-brand-900/15 px-5 py-2 text-sm font-semibold text-brand-900 transition-colors hover:border-brand-700 hover:bg-brand-900 hover:text-white"
            >
              View All
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Crumb() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0 text-slate-300">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex text-gold-500" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4">
          <defs>
            <linearGradient id={`detail-half-${i}-${rating}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <path
            fill={
              rating >= i
                ? "currentColor"
                : rating >= i - 0.5
                  ? `url(#detail-half-${i}-${rating})`
                  : "#e2e8f0"
            }
            d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z"
          />
        </svg>
      ))}
    </span>
  );
}

function RatingBars({ rating, reviews }: { rating: number; reviews: number }) {
  // Deterministic fake distribution weighted toward the average rating.
  const five = Math.round(reviews * (rating >= 4.8 ? 0.9 : rating >= 4.3 ? 0.65 : 0.45));
  const four = Math.round(reviews * (rating >= 4.8 ? 0.1 : 0.25));
  const three = Math.max(0, reviews - five - four);
  const rows: [number, number][] = [
    [5, five],
    [4, four],
    [3, three],
    [2, 0],
    [1, 0],
  ];

  return (
    <div className="w-full max-w-xs space-y-1.5">
      {rows.map(([stars, count]) => (
        <div key={stars} className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-8 shrink-0 font-semibold">{stars} ★</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
              style={{ width: reviews ? `${(count / reviews) * 100}%` : "0%" }}
            />
          </div>
          <span className="w-6 text-right tabular-nums">{count}</span>
        </div>
      ))}
    </div>
  );
}
