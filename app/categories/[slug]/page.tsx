import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CollectionClient } from "@/app/categories/[slug]/collection-client";
import { fetchStoreCategoryBySlug } from "@/app/store/storefrontServer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import {
  buildBreadcrumbJsonLd,
  getSiteUrl,
  noIndexRobots,
  truncateText,
} from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
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
      `Shop ${category.name} at National Electronics. Genuine branded products, nationwide delivery, cash on delivery, and official warranty.`,
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

export default async function CategoryCollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await fetchStoreCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

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
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-10">
              <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-80 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          }
        >
          <CollectionClient slug={slug} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
