import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

export type BannerPlacement = "HOME_HERO" | "HOME_PROMO" | "CATEGORY" | "PRODUCT";

export type BannerLinkType = "PRODUCT" | "CATEGORY" | "URL" | "NONE";

export type BannerRef = {
  id: string;
  name: string;
  slug: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  alt: string | null;
  placement: BannerPlacement;
  linkType: BannerLinkType;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  productId: string | null;
  categoryId: string | null;
  url: string | null;
  href: string | null;
  product: BannerRef | null;
  category: BannerRef | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoreBannerParams = {
  placement: BannerPlacement;
  categoryId?: string;
  productId?: string;
};

export type AdminBannerParams = {
  placement?: BannerPlacement | "";
  isActive?: boolean | "";
};

export type BannerWriteInput = {
  title: string;
  subtitle?: string | null;
  alt?: string | null;
  placement: BannerPlacement;
  linkType: BannerLinkType;
  productId?: string | null;
  categoryId?: string | null;
  url?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type UpdateBannerInput = Partial<BannerWriteInput> & { id: string };

export type ReorderBannersInput = {
  items: Array<{ id: string; sortOrder: number }>;
};

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  errors: Array<{ field?: string; message: string; code?: string }> | null;
  meta: unknown;
};

export type ApiMutationResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: Array<{ field?: string; message: string; code?: string }> | null;
  meta: unknown;
};

export const BANNER_PLACEMENT_LABEL: Record<BannerPlacement, string> = {
  HOME_HERO: "Home hero",
  HOME_PROMO: "Home promo",
  CATEGORY: "Category page",
  PRODUCT: "Product page",
};

export const BANNER_LINK_LABEL: Record<BannerLinkType, string> = {
  PRODUCT: "Product page",
  CATEGORY: "Category page",
  URL: "Custom URL",
  NONE: "Not clickable",
};

export function storefrontBannerHref(banner: Banner): string | null {
  if (banner.linkType === "PRODUCT" && banner.product?.slug) {
    return `/products/${banner.product.slug}`;
  }
  if (banner.linkType === "CATEGORY" && banner.category?.slug) {
    return `/categories/${banner.category.slug}`;
  }
  if (banner.linkType === "URL") {
    return banner.url ?? banner.href;
  }
  if (banner.linkType === "NONE") return null;
  return banner.href;
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function toQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toImageFormData(image: File): FormData {
  const formData = new FormData();
  formData.append("image", image);
  return formData;
}

export const bannerApi = createApi({
  reducerPath: "bannerApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Banner"],
  keepUnusedDataFor: 45,
  endpoints: (builder) => ({
    getStoreBanners: builder.query<ApiListResponse<Banner>, StoreBannerParams>({
      query: ({ placement, categoryId, productId }) => ({
        url: `/banners${toQueryString({ placement, categoryId, productId })}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true },
      providesTags: (result, _error, arg) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({ type: "Banner" as const, id })),
              { type: "Banner", id: `STORE-${arg.placement}` },
              { type: "Banner", id: "LIST" },
            ]
          : [
              { type: "Banner", id: `STORE-${arg.placement}` },
              { type: "Banner", id: "LIST" },
            ],
    }),
    getAdminBanners: builder.query<ApiListResponse<Banner>, AdminBannerParams | void>({
      query: (params) => ({
        url: `/banners/admin${toQueryString({
          placement: params?.placement || undefined,
          isActive:
            params?.isActive === true || params?.isActive === false
              ? params.isActive
              : undefined,
        })}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({ type: "Banner" as const, id })),
              { type: "Banner", id: "ADMIN" },
              { type: "Banner", id: "LIST" },
            ]
          : [
              { type: "Banner", id: "ADMIN" },
              { type: "Banner", id: "LIST" },
            ],
    }),
    getBannerById: builder.query<ApiMutationResponse<Banner>, string>({
      query: (id) => ({
        url: `/banners/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Banner", id }],
    }),
    createBanner: builder.mutation<ApiMutationResponse<Banner>, BannerWriteInput>({
      query: (body) => ({
        url: "/banners",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Banner", id: "LIST" },
        { type: "Banner", id: "ADMIN" },
      ],
    }),
    updateBanner: builder.mutation<ApiMutationResponse<Banner>, UpdateBannerInput>({
      query: ({ id, ...body }) => ({
        url: `/banners/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Banner", id },
        { type: "Banner", id: "LIST" },
        { type: "Banner", id: "ADMIN" },
      ],
    }),
    reorderBanners: builder.mutation<
      ApiMutationResponse<Banner[] | null>,
      ReorderBannersInput
    >({
      query: (body) => ({
        url: "/banners/reorder",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        { type: "Banner", id: "LIST" },
        { type: "Banner", id: "ADMIN" },
      ],
    }),
    uploadBannerImage: builder.mutation<
      ApiMutationResponse<Banner>,
      { id: string; image: File }
    >({
      query: ({ id, image }) => ({
        url: `/banners/${encodeURIComponent(id)}/image`,
        method: "POST",
        body: toImageFormData(image),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Banner", id },
        { type: "Banner", id: "LIST" },
        { type: "Banner", id: "ADMIN" },
      ],
    }),
    uploadBannerMobileImage: builder.mutation<
      ApiMutationResponse<Banner>,
      { id: string; image: File }
    >({
      query: ({ id, image }) => ({
        url: `/banners/${encodeURIComponent(id)}/image/mobile`,
        method: "POST",
        body: toImageFormData(image),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Banner", id },
        { type: "Banner", id: "LIST" },
        { type: "Banner", id: "ADMIN" },
      ],
    }),
    deleteBannerMobileImage: builder.mutation<ApiMutationResponse<Banner | null>, string>({
      query: (id) => ({
        url: `/banners/${encodeURIComponent(id)}/image/mobile`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Banner", id },
        { type: "Banner", id: "LIST" },
        { type: "Banner", id: "ADMIN" },
      ],
    }),
    deleteBanner: builder.mutation<ApiMutationResponse<null>, string>({
      query: (id) => ({
        url: `/banners/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Banner", id },
        { type: "Banner", id: "LIST" },
        { type: "Banner", id: "ADMIN" },
      ],
    }),
  }),
});

export const {
  useGetStoreBannersQuery,
  useGetAdminBannersQuery,
  useGetBannerByIdQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useReorderBannersMutation,
  useUploadBannerImageMutation,
  useUploadBannerMobileImageMutation,
  useDeleteBannerMobileImageMutation,
  useDeleteBannerMutation,
} = bannerApi;
