import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";
import {
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/order/status";

export type { OrderStatus };
export { ORDER_STATUSES };

export type AddressSnapshot = {
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
};

export type OrderLineItem = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type UpdateOrderStatusRequest = {
  status: OrderStatus;
  shippingAmount?: number;
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderLineItem[];
  subtotal: number;
  couponCode: string | null;
  discountAmount: number;
  deliveryMethodName: string;
  shippingAmount: number;
  shippingPending: boolean;
  shippingMessage: string | null;
  taxRate: number;
  taxAmount: number;
  total: number;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  billingSameAsShipping: boolean;
  notes: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusTransition = {
  status: OrderStatus;
  next: OrderStatus[];
};

export type OrderListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | string;
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

function toQueryString(params: OrderListParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Order", "OrderStatus"],
  endpoints: (builder) => ({
    getOrders: builder.query<ApiListResponse<Order>, OrderListParams | void>({
      query: (params) => ({
        url: `/orders${toQueryString({
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
              ...result.data.map(({ id }) => ({ type: "Order" as const, id })),
              { type: "Order", id: "LIST" },
            ]
          : [{ type: "Order", id: "LIST" }],
    }),
    getOrderById: builder.query<ApiMutationResponse<Order>, string>({
      query: (id) => ({
        url: `/orders/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.id
          ? [{ type: "Order", id: result.data.id }]
          : [{ type: "Order", id: "LIST" }],
    }),
    getOrderStatuses: builder.query<
      ApiMutationResponse<OrderStatusTransition[]>,
      void
    >({
      query: () => ({
        url: "/orders/statuses",
        method: "GET",
      }),
      providesTags: [{ type: "OrderStatus", id: "LIST" }],
    }),
    updateOrderStatus: builder.mutation<
      ApiMutationResponse<Order>,
      { id: string } & UpdateOrderStatusRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/orders/${encodeURIComponent(id)}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useLazyGetOrdersQuery,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useGetOrderStatusesQuery,
  useUpdateOrderStatusMutation,
} = orderApi;
