import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionClient } from "@/app/categories/[slug]/collection-client";
import {
  fetchStoreCategoryBySlug,
  fetchStoreCategoryFilters,
  fetchStoreProducts,
} from "@/app/store/storefrontServer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import {
  COLLECTION_PAGE_SIZE,
  catalogStateToApiParams,
  parseNextSearchParams,
} from "@/lib/catalog-query";
import {
  buildBreadcrumbJsonLd,
  getSiteUrl,
  noIndexRobots,
  truncateText,
} from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchStoreCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
      robots: noIndexRobots,
    };
  }

  const description = truncateText(
    category.description ||
      `Shop ${category.name} at National Electronics. Genuine branded products, delivery across Punjab, cash on delivery, and official warranty.`,
    160,
  );
  const canonical = `/categories/${category.slug}`;

  return {
    title: `${category.name} in Pakistan`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${category.name} in Pakistan`,
      description,
      url: canonical,
      images: category.image
        ? [{ url: category.image, alt: category.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} in Pakistan`,
      description,
    },
  };
}

export default async function CategoryCollectionPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const state = parseNextSearchParams(await searchParams);
  const filterQuery = catalogStateToApiParams(state, { status: "ACTIVE" });
  const filterParams = {
    status: "ACTIVE" as const,
    brandId: filterQuery.brandId,
    inStock: filterQuery.inStock,
    attrs: filterQuery.attrs,
  };

  const categoryPromise = fetchStoreCategoryBySlug(slug);
  const filtersPromise = fetchStoreCategoryFilters(slug, filterParams).catch(
    () => null,
  );
  const category = await categoryPromise;

  if (!category) {
    notFound();
  }

  const [filters, productsResult] = await Promise.all([
    filtersPromise,
    fetchStoreProducts(
      catalogStateToApiParams(state, {
        categoryId: category.id,
        status: "ACTIVE",
        limit: COLLECTION_PAGE_SIZE,
      }),
    ).catch(() => null),
  ]);

  const origin = getSiteUrl();

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd(origin, [
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name: category.name, path: `/categories/${category.slug}` },
        ])}
      />
      <Header />
      <main className="flex-1">
        <CollectionClient
          slug={slug}
          initialCategory={category}
          initialProducts={productsResult?.data ?? []}
          initialMeta={productsResult?.meta ?? null}
          initialFilters={filters}
          initialState={state}
        />
      </main>
      <Footer />
    </>
  );
}
