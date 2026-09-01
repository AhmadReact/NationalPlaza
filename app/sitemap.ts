import type { MetadataRoute } from "next";
import {
  fetchAllActiveStoreProducts,
  fetchStoreCategoryTree,
  flattenCategoryTree,
} from "@/app/store/storefrontServer";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 3600;

async function safeProducts() {
  try {
    return await fetchAllActiveStoreProducts();
  } catch {
    return [];
  }
}

async function safeCategories() {
  try {
    return flattenCategoryTree(await fetchStoreCategoryTree());
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteUrl();
  const [products, categories] = await Promise.all([
    safeProducts(),
    safeCategories(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${origin}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${origin}/policies/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${origin}/policies/terms-of-service`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${origin}/policies/refund-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${origin}/categories/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${origin}/products/${product.slug || product.id}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: "daily",
    priority: 0.9,
    images: product.thumbnail?.url ? [product.thumbnail.url] : undefined,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
