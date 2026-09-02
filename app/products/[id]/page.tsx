import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchRelatedStoreProducts,
  fetchStoreProduct,
  isProductUuid,
} from "@/app/store/storefrontServer";
import {
  getProductGalleryImages,
  getProductPricing,
  getStoreProductArt,
  getStoreProductTint,
  toCardProduct,
  type StoreProduct,
} from "@/app/store/customerAPI";
import { formatPrice } from "@/lib/data";
import { getDetailContent } from "@/lib/product-details";
import { DetailTabs } from "@/components/detail-tabs";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductBanners } from "@/components/storefront-banners";
import { PurchaseActions } from "@/components/purchase-actions";
import { JsonLd } from "@/components/json-ld";
import { TrackRecentlyViewed } from "@/components/track-recently-viewed";
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  getSiteUrl,
  noIndexRobots,
  productCanonicalPath,
  productMetaDescription,
} from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

function buildDetailContent(product: StoreProduct) {
  const card = toCardProduct(product);
  const fallback = getDetailContent(card);

  const intro = product.description
    ? product.description
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : fallback.intro;

  const specs = [...(product.specifications ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s): [string, string] => [s.name, s.value]);

  return { intro, specs };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchStoreProduct(id);

  if (!product || product.status === "INACTIVE") {
    return {
      title: "Product Not Found",
      robots: noIndexRobots,
    };
  }

  const description = productMetaDescription(product);
  const canonical = productCanonicalPath(product);
  const image =
    product.thumbnail?.url ??
    product.images?.[0]?.url ??
    undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: canonical,
      images: image
        ? [{ url: image, alt: product.thumbnail?.alt || product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchStoreProduct(id);

  if (!product || product.status === "INACTIVE") {
    notFound();
  }

  if (isProductUuid(id) && product.slug && product.slug !== id) {
    permanentRedirect(`/products/${product.slug}`);
  }

  const origin = getSiteUrl();
  const categoryPath = product.category?.slug
    ? `/categories/${product.category.slug}`
    : "/categories";
  const categoryId = product.category?.slug || product.category?.id || "";
  const categoryName = product.category?.name || "Products";
  const { price, oldPrice, discount } = getProductPricing(product);
  const detail = buildDetailContent(product);
  const galleryImages = getProductGalleryImages(product);
  const inStock = product.stock > 0;
  const related = (
    await fetchRelatedStoreProducts(
      product.category?.id ?? "",
      product.id,
    )
  ).map(toCardProduct);

  const priceUpdated = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <JsonLd data={buildProductJsonLd(origin, product)} />
      <JsonLd
        data={buildBreadcrumbJsonLd(origin, [
          { name: "Home", path: "/" },
          { name: categoryName, path: categoryPath },
          { name: product.name, path: productCanonicalPath(product) },
        ])}
      />
      <Header />
      <main className="flex-1">
        <div className="border-b border-slate-200 bg-white">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto whitespace-nowrap px-4 py-3 text-xs text-slate-500 no-scrollbar"
          >
            <Link
              href="/"
              className="font-medium transition-colors hover:text-brand-700"
            >
              Home
            </Link>
            <Crumb />
            <Link
              href={categoryId ? `/categories/${categoryId}` : "/categories"}
              className="font-medium transition-colors hover:text-brand-700"
            >
              {categoryName}
            </Link>
            <Crumb />
            <span className="font-semibold text-brand-950">{product.name}</span>
          </nav>
        </div>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:py-12 lg:grid-cols-2">
          <ProductGallery
            kind={getStoreProductArt(product)}
            tint={getStoreProductTint(product)}
            discount={discount}
            badge={product.isFeatured ? "Featured" : undefined}
            images={galleryImages}
            productName={product.name}
          />

          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700">
                {product.brand?.name}
              </span>
              <span className="text-xs text-slate-400">{categoryName}</span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-brand-950 sm:text-3xl">
              {product.name}
            </h1>

            {product.sku && (
              <p className="mt-2 text-xs text-slate-400">SKU: {product.sku}</p>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {price ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">
                      {formatPrice(price)}
                    </span>
                    {oldPrice && (
                      <span className="text-base text-slate-400 line-through">
                        {formatPrice(oldPrice)}
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
                {inStock ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-semibold text-emerald-700">In Stock</span>
                    <span className="text-slate-400">
                      — {product.stock} available · ready to ship across Punjab
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="font-semibold text-red-600">Out of Stock</span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6">
              <TrackRecentlyViewed productId={product.id} />
              <PurchaseActions
                productId={product.id}
                inStock={inStock}
                maxQuantity={Math.min(999, Math.max(1, product.stock))}
              />
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-3 text-xs">
              {[
                "Delivery across Punjab",
                "7-day replacement guarantee",
                "Official brand warranty",
                "Cash on delivery available",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold text-slate-600"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-4 w-4 shrink-0 text-gold-600"
                  >
                    <path
                      d="m5 13 4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4">
          <ProductBanners productId={product.id} />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-4">
          <DetailTabs intro={detail.intro} specs={detail.specs} />
        </div>

        {related.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-14 pt-8">
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
        )}
      </main>
      <Footer />
    </>
  );
}

function Crumb() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-3 w-3 shrink-0 text-slate-300"
    >
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
