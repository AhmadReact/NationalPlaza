import { createApi } from "@reduxjs/toolkit/query/react";
import type { AttributeInputType, CatalogApiParams } from "@/lib/catalog-query";
import { toCatalogQueryString } from "@/lib/catalog-query";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  parent: Category | null;
  children: Category[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  children: CategoryTreeNode[];
};

export type CategoryListParams = {
  page?: number;
  limit?: number;
  search?: string;
  /** Omit for all. Pass `null` for root categories only. */
  parentId?: string | null;
  isActive?: boolean;
};

export type CreateCategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  image?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateCategoryInput = {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  image?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type CategoryAttributeOption = {
  id: string;
  attributeId?: string;
  label: string;
  slug?: string;
  value?: string;
  sortOrder: number;
};

export type CategoryAttribute = {
  id: string;
  categoryId?: string;
  name: string;
  slug: string;
  inputType: AttributeInputType;
  isFilterable: boolean;
  isRequired: boolean;
  sortOrder: number;
  options: CategoryAttributeOption[];
};

export type CreateCategoryAttributeInput = {
  categoryId: string;
  name: string;
  inputType: AttributeInputType;
  isFilterable?: boolean;
  isRequired?: boolean;
  options?: Array<{ label: string }>;
};

export type UpdateCategoryAttributeInput = {
  categoryId: string;
  attributeId: string;
  name?: string;
  inputType?: AttributeInputType;
  isFilterable?: boolean;
  isRequired?: boolean;
};

export type DeleteCategoryAttributeInput = {
  categoryId: string;
  attributeId: string;
};

export type ReorderCategoryAttributesInput = {
  categoryId: string;
  items: Array<{ id: string; sortOrder: number }>;
};

export type CreateAttributeOptionInput = {
  categoryId: string;
  attributeId: string;
  label: string;
  sortOrder?: number;
};

export type UpdateAttributeOptionInput = {
  categoryId: string;
  attributeId: string;
  optionId: string;
  label?: string;
  sortOrder?: number;
};

export type DeleteAttributeOptionInput = {
  categoryId: string;
  attributeId: string;
  optionId: string;
};

export type ReorderAttributeOptionsInput = {
  categoryId: string;
  attributeId: string;
  items: Array<{ id: string; sortOrder: number }>;
};

export type CategoryFilterOption = {
  id?: string;
  label: string;
  value?: string;
  slug?: string;
  count: number;
};

export type CategoryFilterGroup = {
  source: "brand" | "availability" | "attribute" | string;
  name?: string;
  label?: string;
  slug?: string;
  inputType?: AttributeInputType | string;
  options: CategoryFilterOption[];
};

export type CategoryFiltersData = {
  id?: string;
  name?: string;
  slug?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  filters: CategoryFilterGroup[];
  price?: {
    min: number | null;
    max: number | null;
  };
};

export type CategoryFiltersParams = CatalogApiParams & {
  slug: string;
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

function toQueryString(params: CategoryListParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    // API expects the literal string "null" for root-only filter
    if (value === null) {
      searchParams.set(key, "null");
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function normalizeAttributesPayload(
  payload: unknown,
): CategoryAttribute[] {
  if (Array.isArray(payload)) return payload as CategoryAttribute[];
  if (payload && typeof payload === "object") {
    const data = payload as {
      attributes?: CategoryAttribute[];
      items?: CategoryAttribute[];
    };
    if (Array.isArray(data.attributes)) return data.attributes;
    if (Array.isArray(data.items)) return data.items;
  }
  return [];
}

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Category", "CategoryAttribute"],
  endpoints: (builder) => ({
    getCategories: builder.query<
      ApiListResponse<Category>,
      CategoryListParams | void
    >({
      query: (params) => ({
        url: `/categories${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          search: params?.search,
          parentId: params?.parentId,
          isActive: params?.isActive,
        })}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({
                type: "Category" as const,
                id,
              })),
              { type: "Category", id: "LIST" },
            ]
          : [{ type: "Category", id: "LIST" }],
    }),
    getCategoryTree: builder.query<
      ApiMutationResponse<CategoryTreeNode[]>,
      void
    >({
      query: () => ({
        url: "/categories/tree",
        method: "GET",
      }),
      providesTags: [{ type: "Category", id: "TREE" }],
    }),
    getCategoryById: builder.query<ApiMutationResponse<Category>, string>({
      query: (id) => ({
        url: `/categories/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Category", id }],
    }),
    getCategoryBySlug: builder.query<ApiMutationResponse<Category>, string>({
      query: (slug) => ({
        url: `/categories/slug/${encodeURIComponent(slug)}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.id
          ? [{ type: "Category", id: result.data.id }]
          : [{ type: "Category", id: "LIST" }],
    }),
    getCategoryFilters: builder.query<
      ApiMutationResponse<CategoryFiltersData>,
      CategoryFiltersParams
    >({
      query: ({ slug, ...params }) => ({
        url: `/categories/slug/${encodeURIComponent(slug)}/filters${toCatalogQueryString(
          params,
        )}`,
        method: "GET",
      }),
      providesTags: (result) => [
        {
          type: "CategoryAttribute",
          id: result?.data?.category?.id ?? result?.data?.id ?? "FILTERS",
        },
      ],
    }),
    getCategoryAttributes: builder.query<
      ApiMutationResponse<CategoryAttribute[]>,
      string
    >({
      query: (categoryId) => ({
        url: `/categories/${encodeURIComponent(categoryId)}/attributes`,
        method: "GET",
      }),
      transformResponse: (
        response: ApiMutationResponse<CategoryAttribute[] | unknown>,
      ): ApiMutationResponse<CategoryAttribute[]> => ({
        ...response,
        data: normalizeAttributesPayload(response.data),
      }),
      providesTags: (_result, _error, categoryId) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),
    createCategoryAttribute: builder.mutation<
      ApiMutationResponse<CategoryAttribute>,
      CreateCategoryAttributeInput
    >({
      query: ({ categoryId, ...body }) => ({
        url: `/categories/${encodeURIComponent(categoryId)}/attributes`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),
    updateCategoryAttribute: builder.mutation<
      ApiMutationResponse<CategoryAttribute>,
      UpdateCategoryAttributeInput
    >({
      query: ({ categoryId, attributeId, ...body }) => ({
        url: `/categories/${encodeURIComponent(categoryId)}/attributes/${encodeURIComponent(attributeId)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),
    deleteCategoryAttribute: builder.mutation<
      ApiMutationResponse<null>,
      DeleteCategoryAttributeInput
    >({
      query: ({ categoryId, attributeId }) => ({
        url: `/categories/${encodeURIComponent(categoryId)}/attributes/${encodeURIComponent(attributeId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),
    reorderCategoryAttributes: builder.mutation<
      ApiMutationResponse<CategoryAttribute[]>,
      ReorderCategoryAttributesInput
    >({
      query: ({ categoryId, items }) => ({
        url: `/categories/${encodeURIComponent(categoryId)}/attributes/reorder`,
        method: "PATCH",
        body: { items },
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),
    createAttributeOption: builder.mutation<
      ApiMutationResponse<CategoryAttributeOption>,
      CreateAttributeOptionInput
    >({
      query: ({ attributeId, label, sortOrder }) => ({
        url: `/attributes/${encodeURIComponent(attributeId)}/options`,
        method: "POST",
        body: { label, sortOrder },
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),
    updateAttributeOption: builder.mutation<
      ApiMutationResponse<CategoryAttributeOption>,
      UpdateAttributeOptionInput
    >({
      query: ({ attributeId, optionId, label, sortOrder }) => ({
        url: `/attributes/${encodeURIComponent(attributeId)}/options/${encodeURIComponent(optionId)}`,
        method: "PATCH",
        body: { label, sortOrder },
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),
    deleteAttributeOption: builder.mutation<
      ApiMutationResponse<null>,
      DeleteAttributeOptionInput
    >({
      query: ({ attributeId, optionId }) => ({
        url: `/attributes/${encodeURIComponent(attributeId)}/options/${encodeURIComponent(optionId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),
    reorderAttributeOptions: builder.mutation<
      ApiMutationResponse<CategoryAttributeOption[]>,
      ReorderAttributeOptionsInput
    >({
      query: ({ attributeId, items }) => ({
        url: `/attributes/${encodeURIComponent(attributeId)}/options/reorder`,
        method: "PATCH",
        body: { items },
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),
    createCategory: builder.mutation<
      ApiMutationResponse<Category>,
      CreateCategoryInput
    >({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Category", id: "LIST" },
        { type: "Category", id: "TREE" },
      ],
    }),
    updateCategory: builder.mutation<
      ApiMutationResponse<Category>,
      UpdateCategoryInput
    >({
      query: ({ id, ...body }) => ({
        url: `/categories/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
        { type: "Category", id: "TREE" },
      ],
    }),
    deleteCategory: builder.mutation<ApiMutationResponse<null>, string>({
      query: (id) => ({
        url: `/categories/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
        { type: "Category", id: "TREE" },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useLazyGetCategoryTreeQuery,
  useGetCategoryByIdQuery,
  useLazyGetCategoryByIdQuery,
  useGetCategoryBySlugQuery,
  useLazyGetCategoryBySlugQuery,
  useGetCategoryFiltersQuery,
  useLazyGetCategoryFiltersQuery,
  useGetCategoryAttributesQuery,
  useLazyGetCategoryAttributesQuery,
  useCreateCategoryAttributeMutation,
  useUpdateCategoryAttributeMutation,
  useDeleteCategoryAttributeMutation,
  useReorderCategoryAttributesMutation,
  useCreateAttributeOptionMutation,
  useUpdateAttributeOptionMutation,
  useDeleteAttributeOptionMutation,
  useReorderAttributeOptionsMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
