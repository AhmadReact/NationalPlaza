import "server-only";
import { cache } from "react";
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fetchJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${getServerApiOrigin()}/api${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Store API ${res.status} for ${path}`);
  }

  return (await res.json()) as T;
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

export function isProductUuid(param: string): boolean {
  return UUID_RE.test(param);
}

/** Resolve a product by slug (preferred) or UUID. */
export const fetchStoreProduct = cache(
  async (param: string): Promise<StoreProduct | null> => {
    const bySlug = await fetchStoreProductBySlug(param);
    if (bySlug) return bySlug;
    if (!UUID_RE.test(param)) return null;
    return fetchStoreProductById(param);
  },
);

export const fetchStoreCategoryBySlug = cache(
  async (slug: string): Promise<Category | null> => {
    const json = await fetchJson<ApiMutationResponse<Category>>(
      `/categories/slug/${encodeURIComponent(slug)}`,
    );
    return json?.data ?? null;
  },
);

export const fetchStoreCategoryTree = cache(
  async (): Promise<CategoryTreeNode[]> => {
    const json = await fetchJson<ApiMutationResponse<CategoryTreeNode[]>>(
      "/categories/tree",
    );
    return json?.data ?? [];
  },
);

export function flattenCategoryTree(
  nodes: CategoryTreeNode[],
): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];
  const walk = (list: CategoryTreeNode[]) => {
    for (const node of list) {
      if (node.isActive === false) continue;
      result.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

export async function fetchAllActiveStoreProducts(): Promise<StoreProduct[]> {
  const limit = 100;
  const first = await fetchJson<ApiListResponse<StoreProduct>>(
    `/products${toCatalogQueryString({ page: 1, limit, status: "ACTIVE" })}`,
  );

  if (!first?.data) return [];

  const products = [...first.data];
  const totalPages = Math.min(first.meta?.totalPages ?? 1, 50);

  for (let page = 2; page <= totalPages; page++) {
    const next = await fetchJson<ApiListResponse<StoreProduct>>(
      `/products${toCatalogQueryString({ page, limit, status: "ACTIVE" })}`,
    );
    if (next?.data?.length) products.push(...next.data);
  }

  return products.filter((product) => product.status === "ACTIVE");
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
