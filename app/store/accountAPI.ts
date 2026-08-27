import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";
import type { StoreProduct, StoreProductRef } from "@/app/store/customerAPI";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  meta: unknown;
};

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  errors: unknown;
  meta: unknown;
};

export type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAddressInput = {
  fullName: string;
  line1: string;
  city: string;
  postalCode: string;
  label?: string;
  phone?: string;
  line2?: string;
  state?: string;
  country?: string;
  isDefault?: boolean;
};

export type UpdateAddressInput = Partial<CreateAddressInput>;

export type CustomerPreferences = {
  newsletter: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  currency: string;
  timezone: string | null;
};

export type UpdatePreferencesInput = Partial<CustomerPreferences>;

export type ProductIdInput = {
  productId: string;
};

export type WishlistToggleResult = {
  productId: string;
  inWishlist: boolean;
  item?: AccountCatalogItem | null;
};

export type AccountCatalogItem = StoreProduct & {
  productId?: string;
  viewedAt?: string;
  createdAt?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asRef(value: unknown, fallbackName = ""): StoreProductRef {
  const rec = asRecord(value);
  if (rec) {
    return {
      id: asString(rec.id),
      name: asString(rec.name, fallbackName),
      slug: asString(rec.slug),
    };
  }
  if (typeof value === "string" && value.trim()) {
    return { id: "", name: value, slug: "" };
  }
  return { id: "", name: fallbackName, slug: "" };
}

function asProductArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const rec = asRecord(data);
  if (Array.isArray(rec?.items)) return rec.items;
  if (Array.isArray(rec?.products)) return rec.products;
  return [];
}

export function unwrapAccountProduct(item: unknown): StoreProduct | null {
  const rec = asRecord(item);
  if (!rec) return null;

  const nested = asRecord(rec.product) ?? rec;
  const id = asString(nested.id) || asString(rec.productId);
  if (!id) return null;

  const status = nested.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

  return {
    id,
    name: asString(nested.name, "Product"),
    slug: asString(nested.slug, id),
    sku: asString(nested.sku) || undefined,
    description:
      typeof nested.description === "string" ? nested.description : null,
    price: asNumber(nested.price),
    salePrice:
      typeof nested.salePrice === "number" ? nested.salePrice : null,
    stock: asNumber(nested.stock),
    isFeatured: Boolean(nested.isFeatured),
    status,
    brand: asRef(nested.brand),
    category: asRef(nested.category),
    images: Array.isArray(nested.images)
      ? (nested.images as StoreProduct["images"])
      : [],
    thumbnail:
      nested.thumbnail && typeof nested.thumbnail === "object"
        ? (nested.thumbnail as StoreProduct["thumbnail"])
        : null,
    specifications: Array.isArray(nested.specifications)
      ? (nested.specifications as StoreProduct["specifications"])
      : undefined,
  };
}

export function unwrapAccountProducts(data: unknown): StoreProduct[] {
  return asProductArray(data)
    .map(unwrapAccountProduct)
    .filter((product): product is StoreProduct => product != null);
}

export function getAccountProductId(item: unknown): string | null {
  const rec = asRecord(item);
  if (!rec) return null;
  if (typeof rec.productId === "string" && rec.productId) return rec.productId;
  const nested = asRecord(rec.product);
  if (typeof nested?.id === "string" && nested.id) return nested.id;
  if (typeof rec.id === "string" && rec.id) return rec.id;
  return null;
}

function normalizePreferences(
  data: CustomerPreferences | null | undefined,
): CustomerPreferences {
  return {
    newsletter: Boolean(data?.newsletter),
    emailNotifications: data?.emailNotifications !== false,
    smsNotifications: Boolean(data?.smsNotifications),
    pushNotifications: data?.pushNotifications !== false,
    language: data?.language || "en",
    currency: data?.currency || "PKR",
    timezone: data?.timezone ?? "Asia/Karachi",
  };
}

function asWishlistToggle(
  response: ApiResponse<unknown>,
  productId: string,
): ApiResponse<WishlistToggleResult> {
  const rec = asRecord(response.data);
  const inWishlist =
    rec?.inWishlist === true ||
    rec?.added === true ||
    rec?.productId === productId ||
    Boolean(rec?.product);

  return {
    ...response,
    data: {
      productId: asString(rec?.productId, productId),
      inWishlist,
      item: rec as AccountCatalogItem | null,
    },
  };
}

export const accountApi = createApi({
  reducerPath: "accountApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Address", "Wishlist", "RecentlyViewed", "Preferences"],
  endpoints: (builder) => ({
    getAddresses: builder.query<ApiListResponse<Address>, void>({
      query: () => ({ url: "/customer/addresses", method: "GET" }),
      transformResponse: (
        response: ApiListResponse<Address> | ApiResponse<Address[] | null>,
      ): ApiListResponse<Address> => ({
        ...response,
        data: Array.isArray(response.data) ? response.data : [],
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({
                type: "Address" as const,
                id,
              })),
              { type: "Address", id: "LIST" },
            ]
          : [{ type: "Address", id: "LIST" }],
    }),
    getAddress: builder.query<ApiResponse<Address>, string>({
      query: (id) => ({
        url: `/customer/addresses/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Address", id }],
    }),
    createAddress: builder.mutation<ApiResponse<Address>, CreateAddressInput>({
      query: (body) => ({
        url: "/customer/addresses",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Address", id: "LIST" }],
    }),
    updateAddress: builder.mutation<
      ApiResponse<Address>,
      { id: string; body: UpdateAddressInput }
    >({
      query: ({ id, body }) => ({
        url: `/customer/addresses/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Address", id },
        { type: "Address", id: "LIST" },
      ],
    }),
    deleteAddress: builder.mutation<ApiResponse<Address | null>, string>({
      query: (id) => ({
        url: `/customer/addresses/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Address", id: "LIST" }],
    }),
    setDefaultAddress: builder.mutation<ApiResponse<Address>, string>({
      query: (id) => ({
        url: `/customer/addresses/${encodeURIComponent(id)}/default`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Address", id: "LIST" }],
    }),

    getWishlist: builder.query<ApiListResponse<unknown>, void>({
      query: () => ({ url: "/customer/wishlist", method: "GET" }),
      extraOptions: { skipErrorToast: true },
      transformResponse: (
        response: ApiResponse<unknown> | ApiListResponse<unknown>,
      ): ApiListResponse<unknown> => ({
        ...response,
        data: asProductArray(response.data),
      }),
      providesTags: [{ type: "Wishlist", id: "LIST" }],
    }),
    getWishlistItem: builder.query<ApiResponse<unknown>, string>({
      query: (productId) => ({
        url: `/customer/wishlist/${encodeURIComponent(productId)}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true },
      providesTags: (_result, _error, productId) => [
        { type: "Wishlist", id: productId },
      ],
    }),
    addWishlistItem: builder.mutation<ApiResponse<unknown>, ProductIdInput>({
      query: (body) => ({
        url: "/customer/wishlist",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Wishlist", id: "LIST" }],
    }),
    toggleWishlist: builder.mutation<
      ApiResponse<WishlistToggleResult>,
      ProductIdInput
    >({
      query: (body) => ({
        url: "/customer/wishlist/toggle",
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<unknown>, _meta, arg) =>
        asWishlistToggle(response, arg.productId),
      invalidatesTags: [{ type: "Wishlist", id: "LIST" }],
    }),
    removeWishlistItem: builder.mutation<ApiResponse<unknown>, string>({
      query: (productId) => ({
        url: `/customer/wishlist/${encodeURIComponent(productId)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Wishlist", id: "LIST" }],
    }),
    clearWishlist: builder.mutation<ApiResponse<unknown>, void>({
      query: () => ({ url: "/customer/wishlist", method: "DELETE" }),
      invalidatesTags: [{ type: "Wishlist", id: "LIST" }],
    }),

    getRecentlyViewed: builder.query<ApiListResponse<unknown>, void>({
      query: () => ({ url: "/customer/recently-viewed", method: "GET" }),
      extraOptions: { skipErrorToast: true },
      transformResponse: (
        response: ApiResponse<unknown> | ApiListResponse<unknown>,
      ): ApiListResponse<unknown> => ({
        ...response,
        data: asProductArray(response.data),
      }),
      providesTags: [{ type: "RecentlyViewed", id: "LIST" }],
    }),
    trackRecentlyViewed: builder.mutation<ApiResponse<unknown>, ProductIdInput>({
      query: (body) => ({
        url: "/customer/recently-viewed",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: [{ type: "RecentlyViewed", id: "LIST" }],
    }),
    removeRecentlyViewed: builder.mutation<ApiResponse<unknown>, string>({
      query: (productId) => ({
        url: `/customer/recently-viewed/${encodeURIComponent(productId)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "RecentlyViewed", id: "LIST" }],
    }),
    clearRecentlyViewed: builder.mutation<ApiResponse<unknown>, void>({
      query: () => ({ url: "/customer/recently-viewed", method: "DELETE" }),
      invalidatesTags: [{ type: "RecentlyViewed", id: "LIST" }],
    }),

    getPreferences: builder.query<ApiResponse<CustomerPreferences>, void>({
      query: () => ({ url: "/customer/preferences", method: "GET" }),
      transformResponse: (
        response: ApiResponse<CustomerPreferences | null | undefined>,
      ): ApiResponse<CustomerPreferences> => ({
        ...response,
        data: normalizePreferences(response.data),
      }),
      providesTags: [{ type: "Preferences", id: "CURRENT" }],
    }),
    updatePreferences: builder.mutation<
      ApiResponse<CustomerPreferences>,
      UpdatePreferencesInput
    >({
      query: (body) => ({
        url: "/customer/preferences",
        method: "PATCH",
        body,
      }),
      transformResponse: (
        response: ApiResponse<CustomerPreferences | null | undefined>,
      ): ApiResponse<CustomerPreferences> => ({
        ...response,
        data: normalizePreferences(response.data),
      }),
      invalidatesTags: [{ type: "Preferences", id: "CURRENT" }],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useGetAddressQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useGetWishlistQuery,
  useGetWishlistItemQuery,
  useAddWishlistItemMutation,
  useToggleWishlistMutation,
  useRemoveWishlistItemMutation,
  useClearWishlistMutation,
  useGetRecentlyViewedQuery,
  useTrackRecentlyViewedMutation,
  useRemoveRecentlyViewedMutation,
  useClearRecentlyViewedMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} = accountApi;
