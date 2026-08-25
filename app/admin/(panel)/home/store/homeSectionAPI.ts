import { createApi } from "@reduxjs/toolkit/query/react";
import type { HomeSection, HomeSectionType } from "@/lib/home";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

export type HomeSectionListParams = {
  type?: HomeSectionType | "";
  isActive?: boolean | "";
};

export type CreateHomeSectionInput = {
  title?: string | null;
  type: HomeSectionType;
  categoryId?: string | null;
  productLimit?: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateHomeSectionInput = Partial<CreateHomeSectionInput> & {
  id: string;
};

export type ReorderHomeSectionsInput = {
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

function normalizeListPayload(payload: unknown): HomeSection[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const data = payload as { items?: HomeSection[]; sections?: HomeSection[] };
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.sections)) return data.sections;
  }
  return [];
}

export const homeSectionApi = createApi({
  reducerPath: "homeSectionApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["HomeSection"],
  endpoints: (builder) => ({
    getHomeSections: builder.query<
      ApiListResponse<HomeSection>,
      HomeSectionListParams | void
    >({
      query: (params) => ({
        url: `/home/sections${toQueryString({
          type: params?.type || undefined,
          isActive:
            params?.isActive === true || params?.isActive === false
              ? params.isActive
              : undefined,
        })}`,
        method: "GET",
      }),
      transformResponse: (
        response: ApiListResponse<HomeSection[] | HomeSection | unknown>,
      ): ApiListResponse<HomeSection> => ({
        ...response,
        data: normalizeListPayload(response.data),
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({
                type: "HomeSection" as const,
                id,
              })),
              { type: "HomeSection", id: "LIST" },
            ]
          : [{ type: "HomeSection", id: "LIST" }],
    }),
    getHomeSectionById: builder.query<ApiMutationResponse<HomeSection>, string>({
      query: (id) => ({
        url: `/home/sections/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "HomeSection", id }],
    }),
    createHomeSection: builder.mutation<
      ApiMutationResponse<HomeSection>,
      CreateHomeSectionInput
    >({
      query: (body) => ({
        url: "/home/sections",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "HomeSection", id: "LIST" }],
    }),
    updateHomeSection: builder.mutation<
      ApiMutationResponse<HomeSection>,
      UpdateHomeSectionInput
    >({
      query: ({ id, ...body }) => ({
        url: `/home/sections/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "HomeSection", id },
        { type: "HomeSection", id: "LIST" },
      ],
    }),
    reorderHomeSections: builder.mutation<
      ApiMutationResponse<HomeSection[] | null>,
      ReorderHomeSectionsInput
    >({
      query: (body) => ({
        url: "/home/sections/reorder",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "HomeSection", id: "LIST" }],
    }),
    deleteHomeSection: builder.mutation<ApiMutationResponse<null>, string>({
      query: (id) => ({
        url: `/home/sections/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "HomeSection", id },
        { type: "HomeSection", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetHomeSectionsQuery,
  useGetHomeSectionByIdQuery,
  useCreateHomeSectionMutation,
  useUpdateHomeSectionMutation,
  useReorderHomeSectionsMutation,
  useDeleteHomeSectionMutation,
} = homeSectionApi;
