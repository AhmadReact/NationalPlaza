import { createApi } from "@reduxjs/toolkit/query/react";
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

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Category"],
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
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
