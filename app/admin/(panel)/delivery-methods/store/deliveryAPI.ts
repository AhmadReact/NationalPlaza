import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

export type DeliveryMethod = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateDeliveryMethodInput = {
  code: string;
  name: string;
  price: number;
  description?: string;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateDeliveryMethodInput = {
  id: string;
  name?: string;
  description?: string | null;
  price?: number;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  errors: unknown;
  meta: unknown;
};

export type ApiMutationResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  meta: unknown;
};

export const deliveryApi = createApi({
  reducerPath: "deliveryApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["DeliveryMethod"],
  endpoints: (builder) => ({
    getAdminDeliveryMethods: builder.query<
      ApiListResponse<DeliveryMethod>,
      void
    >({
      query: () => ({
        url: "/delivery-methods/admin",
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({
                type: "DeliveryMethod" as const,
                id,
              })),
              { type: "DeliveryMethod", id: "LIST" },
            ]
          : [{ type: "DeliveryMethod", id: "LIST" }],
    }),
    createDeliveryMethod: builder.mutation<
      ApiMutationResponse<DeliveryMethod>,
      CreateDeliveryMethodInput
    >({
      query: (body) => ({
        url: "/delivery-methods",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DeliveryMethod", id: "LIST" }],
    }),
    updateDeliveryMethod: builder.mutation<
      ApiMutationResponse<DeliveryMethod>,
      UpdateDeliveryMethodInput
    >({
      query: ({ id, ...body }) => ({
        url: `/delivery-methods/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DeliveryMethod", id },
        { type: "DeliveryMethod", id: "LIST" },
      ],
    }),
    deleteDeliveryMethod: builder.mutation<ApiMutationResponse<null>, string>({
      query: (id) => ({
        url: `/delivery-methods/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DeliveryMethod", id },
        { type: "DeliveryMethod", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAdminDeliveryMethodsQuery,
  useCreateDeliveryMethodMutation,
  useUpdateDeliveryMethodMutation,
  useDeleteDeliveryMethodMutation,
} = deliveryApi;
