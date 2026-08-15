import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

export type BrandStatus = "ACTIVE" | "INACTIVE" | string;

export type BrandListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: BrandStatus;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  status: BrandStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateBrandInput = {
  name: string;
  slug?: string;
  description?: string;
  status?: BrandStatus;
  logo?: File | null;
};

export type UpdateBrandInput = {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  status?: BrandStatus;
  removeLogo?: boolean;
  logo?: File | null;
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

function toQueryString(params: BrandListParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toBrandFormData(
  input: Omit<CreateBrandInput, "name"> & {
    name?: string;
    removeLogo?: boolean;
  },
): FormData {
  const formData = new FormData();

  if (input.name !== undefined && input.name !== "") {
    formData.append("name", input.name);
  }
  if (input.slug !== undefined && input.slug !== "") {
    formData.append("slug", input.slug);
  }
  if (input.description !== undefined && input.description !== "") {
    formData.append("description", input.description);
  }
  if (input.status !== undefined && input.status !== "") {
    formData.append("status", input.status);
  }
  if (input.removeLogo !== undefined) {
    formData.append("removeLogo", String(input.removeLogo));
  }
  if (input.logo) {
    formData.append("logo", input.logo);
  }

  return formData;
}

export const brandApi = createApi({
  reducerPath: "brandApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Brand"],
  endpoints: (builder) => ({
    getBrands: builder.query<ApiListResponse<Brand>, BrandListParams | void>({
      query: (params) => ({
        url: `/brands${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          search: params?.search,
          status: params?.status,
        })}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({ type: "Brand" as const, id })),
              { type: "Brand", id: "LIST" },
            ]
          : [{ type: "Brand", id: "LIST" }],
    }),
    getBrandBySlug: builder.query<ApiMutationResponse<Brand>, string>({
      query: (slug) => ({
        url: `/brands/slug/${encodeURIComponent(slug)}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.id
          ? [{ type: "Brand", id: result.data.id }]
          : [{ type: "Brand", id: "LIST" }],
    }),
    createBrand: builder.mutation<
      ApiMutationResponse<Brand>,
      CreateBrandInput
    >({
      query: (input) => ({
        url: "/brands",
        method: "POST",
        body: toBrandFormData(input),
      }),
      invalidatesTags: [{ type: "Brand", id: "LIST" }],
    }),
    updateBrand: builder.mutation<
      ApiMutationResponse<Brand>,
      UpdateBrandInput
    >({
      query: ({ id, ...input }) => ({
        url: `/brands/${encodeURIComponent(id)}`,
        method: "PATCH",
        body: toBrandFormData(input),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Brand", id },
        { type: "Brand", id: "LIST" },
      ],
    }),
    deleteBrand: builder.mutation<ApiMutationResponse<null>, string>({
      query: (id) => ({
        url: `/brands/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Brand", id },
        { type: "Brand", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetBrandsQuery,
  useLazyGetBrandsQuery,
  useGetBrandBySlugQuery,
  useLazyGetBrandBySlugQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandApi;
