import "server-only";
import type {
  Category,
  CategoryTreeNode,
} from "@/app/admin/(panel)/categories/store/categoryAPI";
import type {
  ApiListResponse,
  ApiMutationResponse,
  StoreProduct,
} from "@/app/store/customerAPI";
import { toCatalogQueryString } from "@/lib/catalog-query";
import { getServerApiOrigin } from "@/lib/api/serverOrigin";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${getServerApiOrigin()}/api${path}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchStoreProductBySlug(
  slug: string,
): Promise<StoreProduct | null> {
  const json = await fetchJson<ApiMutationResponse<StoreProduct>>(
    `/products/slug/${encodeURIComponent(slug)}`,
  );
  return json?.data ?? null;
}

export async function fetchStoreProductById(
  id: string,
): Promise<StoreProduct | null> {
  const json = await fetchJson<ApiMutationResponse<StoreProduct>>(
    `/products/${encodeURIComponent(id)}`,
  );
  return json?.data ?? null;
}

/** Resolve a product by slug (preferred) or id. */
export async function fetchStoreProduct(
  param: string,
): Promise<StoreProduct | null> {
  const bySlug = await fetchStoreProductBySlug(param);
  if (bySlug) return bySlug;
  return fetchStoreProductById(param);
}

export async function fetchStoreCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const json = await fetchJson<ApiMutationResponse<Category>>(
    `/categories/slug/${encodeURIComponent(slug)}`,
  );
  return json?.data ?? null;
}

export async function fetchStoreCategoryTree(): Promise<CategoryTreeNode[]> {
  const json = await fetchJson<ApiMutationResponse<CategoryTreeNode[]>>(
    "/categories/tree",
  );
  return json?.data ?? [];
}

export async function fetchRelatedStoreProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
): Promise<StoreProduct[]> {
  if (!categoryId) return [];

  const json = await fetchJson<ApiListResponse<StoreProduct>>(
    `/products${toCatalogQueryString({
      page: 1,
      limit: limit + 4,
      categoryId,
      status: "ACTIVE",
    })}`,
  );

  return (json?.data ?? [])
    .filter((p) => p.id !== excludeId)
    .slice(0, limit);
}
