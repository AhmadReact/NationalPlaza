import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";
import type { ArtKind, Product as CardProduct } from "@/lib/data";

export type StoreProductRef = {
  id: string;
  name: string;
  slug: string;
};

export type StoreProductImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isThumbnail: boolean;
};

export type StoreProductSpecification = {
  id: string;
  name: string;
  value: string;
  sortOrder: number;
};

export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  isFeatured: boolean;
  status: "ACTIVE" | "INACTIVE";
  brand: StoreProductRef;
  category: StoreProductRef;
  images: StoreProductImage[];
  thumbnail: StoreProductImage | null;
  specifications?: StoreProductSpecification[];
};

export type StoreProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
  categoryId?: string;
  isFeatured?: boolean;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  errors: unknown;
  meta: PaginationMeta;
};

export type ApiMutationResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  meta: unknown;
};

const CATEGORY_ART: Record<string, ArtKind> = {
  "air-conditioners": "ac",
  ac: "ac",
  refrigerators: "fridge",
  fridge: "fridge",
  "air-coolers": "cooler",
  cooler: "cooler",
  "led-tvs": "tv",
  tv: "tv",
  "washing-machines": "washing",
  "deep-freezers": "freezer",
  "water-dispensers": "dispenser",
  "air-fryers": "airfryer",
  "kitchen-hobs": "hob",
  "kitchen-hoods": "hood",
  "built-in-ovens": "oven",
  "kitchen-appliances": "microwave",
};

const CATEGORY_TINT: Record<string, string> = {
  "air-conditioners": "from-sky-100 via-cyan-50 to-white",
  refrigerators: "from-emerald-100 via-teal-50 to-white",
  "air-coolers": "from-cyan-100 via-sky-50 to-white",
  "led-tvs": "from-violet-100 via-purple-50 to-white",
  "washing-machines": "from-blue-100 via-indigo-50 to-white",
};

function toQueryString(params: StoreProductListParams & { status?: string }): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function resolveArt(categorySlug: string): ArtKind {
  const slug = categorySlug.toLowerCase();
  if (CATEGORY_ART[slug]) return CATEGORY_ART[slug];
  for (const [key, art] of Object.entries(CATEGORY_ART)) {
    if (slug.includes(key)) return art;
  }
  return "ac";
}

function resolveTint(categorySlug: string): string {
  const slug = categorySlug.toLowerCase();
  if (CATEGORY_TINT[slug]) return CATEGORY_TINT[slug];
  for (const [key, tint] of Object.entries(CATEGORY_TINT)) {
    if (slug.includes(key)) return tint;
  }
  return "from-slate-100 via-slate-50 to-white";
}

export function getProductPricing(product: StoreProduct) {
  const hasSale =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    product.salePrice < product.price;

  const price = hasSale ? product.salePrice! : product.price;
  const oldPrice = hasSale ? product.price : undefined;
  const discount =
    oldPrice && price
      ? Math.round((1 - price / oldPrice) * 100)
      : null;

  return { price, oldPrice, discount, hasSale };
}

/** Sorted gallery images — thumbnail first, then by sortOrder. */
export function getProductGalleryImages(product: StoreProduct): StoreProductImage[] {
  const images = [...(product.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  if (images.length > 0) return images;

  if (product.thumbnail) return [product.thumbnail];

  return [];
}

/** Maps API product shape to the storefront ProductCard model. */
export function toCardProduct(product: StoreProduct): CardProduct {
  const { price, oldPrice } = getProductPricing(product);

  return {
    id: product.slug || product.id,
    productId: product.id,
    slug: product.slug,
    brand: product.brand?.name ?? "",
    name: product.name,
    price,
    oldPrice,
    reviews: 0,
    rating: 0,
    art: resolveArt(product.category?.slug ?? ""),
    tint: resolveTint(product.category?.slug ?? ""),
    badge: product.isFeatured ? "Featured" : undefined,
    imageUrl: product.thumbnail?.url ?? product.images?.[0]?.url,
  };
}

export function getStoreProductArt(product: StoreProduct): ArtKind {
  return resolveArt(product.category?.slug ?? "");
}

export function getStoreProductTint(product: StoreProduct): string {
  return resolveTint(product.category?.slug ?? "");
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api${path}`, {
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

export async function fetchRelatedStoreProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
): Promise<StoreProduct[]> {
  if (!categoryId) return [];

  const json = await fetchJson<ApiListResponse<StoreProduct>>(
    `/products${toQueryString({
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

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["StoreProduct"],
  endpoints: (builder) => ({
    getStoreProducts: builder.query<
      ApiListResponse<StoreProduct>,
      StoreProductListParams | void
    >({
      query: (params) => ({
        url: `/products${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 24,
          search: params?.search,
          brandId: params?.brandId,
          categoryId: params?.categoryId,
          isFeatured: params?.isFeatured,
          status: "ACTIVE",
        })}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({
                type: "StoreProduct" as const,
                id,
              })),
              { type: "StoreProduct", id: "LIST" },
            ]
          : [{ type: "StoreProduct", id: "LIST" }],
    }),
    getStoreProductById: builder.query<
      ApiMutationResponse<StoreProduct>,
      string
    >({
      query: (id) => ({
        url: `/products/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true },
      providesTags: (_result, _error, id) => [{ type: "StoreProduct", id }],
    }),
    getStoreProductBySlug: builder.query<
      ApiMutationResponse<StoreProduct>,
      string
    >({
      query: (slug) => ({
        url: `/products/slug/${encodeURIComponent(slug)}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true },
      providesTags: (result) =>
        result?.data?.id
          ? [{ type: "StoreProduct", id: result.data.id }]
          : [{ type: "StoreProduct", id: "LIST" }],
    }),
  }),
});

export const {
  useGetStoreProductsQuery,
  useLazyGetStoreProductsQuery,
  useGetStoreProductByIdQuery,
  useLazyGetStoreProductByIdQuery,
  useGetStoreProductBySlugQuery,
  useLazyGetStoreProductBySlugQuery,
} = customerApi;
