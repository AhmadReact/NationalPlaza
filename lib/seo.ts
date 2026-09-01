import type { StoreProduct } from "@/app/store/customerAPI";

export const SITE_NAME = "National Electronics";
export const SITE_TAGLINE =
  "Pakistan's Trusted Electronics Store Since 1946";
export const SITE_DESCRIPTION =
  "National Electronics has served Pakistan since 1946. Shop air conditioners, refrigerators, air coolers, LED TVs and all home appliances at the best prices with nationwide delivery.";
export const SITE_EMAIL = "info@nationalelectronics.pk";
export const SITE_PHONE = "+92-334-4376840";

const DEFAULT_SITE_URL = "https://nationaleshop.com";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function toPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value: string, max = 160): string {
  const text = toPlainText(value);
  if (text.length <= max) return text;
  const sliced = text.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

export const indexFollowRobots = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export const noIndexRobots = {
  index: false,
  follow: false,
};

export const noIndexFollowRobots = {
  index: false,
  follow: true,
};

export function buildSiteGraphJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: SITE_NAME,
        url: origin,
        logo: `${origin}/icon.svg`,
        email: SITE_EMAIL,
        telephone: SITE_PHONE,
        foundingDate: "1946",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Thana Bazar",
          addressLocality: "Arifwala",
          addressCountry: "PK",
        },
        areaServed: {
          "@type": "Country",
          name: "Pakistan",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: SITE_NAME,
        url: origin,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${origin}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${origin}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function buildBreadcrumbJsonLd(
  origin: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path.startsWith("http")
        ? item.path
        : `${origin}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function productCanonicalPath(product: StoreProduct): string {
  return `/products/${product.slug || product.id}`;
}

export function productMetaDescription(product: StoreProduct): string {
  const fromApi = toPlainText(product.description ?? "");
  if (fromApi) return truncateText(fromApi, 160);

  const brand = product.brand?.name;
  const category = product.category?.name;
  const label = [brand, category].filter(Boolean).join(" ");
  return truncateText(
    `Buy ${product.name} in Pakistan at ${SITE_NAME}.${label ? ` ${label}` : ""} with nationwide delivery, cash on delivery, and official warranty.`,
    160,
  );
}

function productOfferPrice(product: StoreProduct): number | null {
  const hasSale =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    product.salePrice < product.price;
  const price = hasSale ? product.salePrice : product.price;
  return price ? price : null;
}

function productImageUrls(product: StoreProduct): string[] {
  const images = [...(product.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const urls = images.map((image) => image.url).filter(Boolean);
  if (urls.length > 0) return urls;
  return product.thumbnail?.url ? [product.thumbnail.url] : [];
}

export function buildProductJsonLd(origin: string, product: StoreProduct) {
  const price = productOfferPrice(product);
  const url = `${origin}${productCanonicalPath(product)}`;
  const images = productImageUrls(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productMetaDescription(product),
    sku: product.sku || undefined,
    image: images.length > 0 ? images : undefined,
    brand: product.brand?.name
      ? { "@type": "Brand", name: product.brand.name }
      : undefined,
    category: product.category?.name || undefined,
    url,
    offers: price
      ? {
          "@type": "Offer",
          url,
          priceCurrency: "PKR",
          price: Number(price).toFixed(2),
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: SITE_NAME,
            url: origin,
          },
        }
      : undefined,
  };
}
