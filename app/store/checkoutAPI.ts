import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";
import type { OrderStatus } from "@/lib/order/status";
import type { Address, CreateAddressInput } from "@/app/store/accountAPI";

export type { Address, CreateAddressInput };

export type DeliveryMethod = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  quotesLiveRates?: boolean;
  isActive: boolean;
  sortOrder?: number;
};

export type ShippingBreakdown = {
  shipmentCharges: number;
  cashHandling: number;
  insuranceCharges: number;
  gstAmount: number;
  fuelSurchargeAmount: number;
  total: number;
};

export type CheckoutAddressSnapshot = {
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
};

export type CheckoutLineItem = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type CheckoutPreview = {
  items: CheckoutLineItem[];
  subtotal: number;
  couponCode: string | null;
  discountAmount: number;
  deliveryMethodName: string;
  deliveryMethodCode?: string;
  quotesLiveRates?: boolean;
  shippingAmount: number;
  shippingPending: boolean;
  shippingMessage: string | null;
  shippingBreakdown?: ShippingBreakdown;
  taxRate: number;
  taxAmount: number;
  taxableAmount: number;
  total: number;
  shippingAddress: CheckoutAddressSnapshot;
  billingAddress: CheckoutAddressSnapshot;
  billingSameAsShipping: boolean;
  guestEmail?: string;
  guestPhone?: string | null;
};

export type PlaceOrderResult = Omit<
  CheckoutPreview,
  "shippingMessage" | "guestEmail" | "guestPhone"
> & {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  shippingMessage: string | null;
  notes: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CheckoutOtpResult = {
  phoneMasked: string;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
};

export type CheckoutInput = {
  shippingAddressId: string;
  deliveryMethodId: string;
  billingSameAsShipping?: boolean;
  billingAddressId?: string;
  couponCode?: string;
  notes?: string;
};

export type PlaceOrderInput = CheckoutInput & {
  otp: string;
};

export type GuestCheckoutAddressInput = {
  fullName: string;
  line1: string;
  city: string;
  postalCode: string;
  phone?: string;
  line2?: string;
  state?: string;
  country?: string;
};

export type GuestCheckoutInput = {
  guestToken: string;
  email: string;
  phone?: string;
  shippingAddress: GuestCheckoutAddressInput;
  deliveryMethodId: string;
  billingSameAsShipping?: boolean;
  billingAddress?: GuestCheckoutAddressInput;
  couponCode?: string;
  notes?: string;
};

export type PlaceGuestOrderInput = GuestCheckoutInput & {
  otp: string;
};

export type CouponValidateInput = {
  code: string;
  subtotal: number;
};

export type CouponValidateResult = {
  code: string;
  discountAmount: number;
  message?: string;
};

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

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CustomerOrderListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | string;
};

export type CustomerOrdersResponse = {
  success: boolean;
  message: string;
  data: PlaceOrderResult[];
  errors: unknown;
  meta: PaginationMeta;
};

function toQueryString(params: CustomerOrderListParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asPositiveInt(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function normalizePaginationMeta(
  meta: unknown,
  dataLength: number,
): PaginationMeta {
  const rec = asRecord(meta) ?? {};
  const page = asPositiveInt(rec.page, 1);
  const limit = asPositiveInt(rec.limit, 20);
  const total = typeof rec.total === "number" ? rec.total : dataLength;
  const totalPages = asPositiveInt(
    rec.totalPages,
    Math.max(1, Math.ceil((total || 1) / limit)),
  );

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage:
      typeof rec.hasNextPage === "boolean" ? rec.hasNextPage : page < totalPages,
    hasPreviousPage:
      typeof rec.hasPreviousPage === "boolean"
        ? rec.hasPreviousPage
        : page > 1,
  };
}

export const checkoutApi = createApi({
  reducerPath: "checkoutApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["DeliveryMethod", "Order"],
  endpoints: (builder) => ({
    getDeliveryMethods: builder.query<ApiListResponse<DeliveryMethod>, void>({
      query: () => ({ url: "/delivery-methods", method: "GET" }),
      extraOptions: { skipErrorToast: true },
      providesTags: ["DeliveryMethod"],
    }),
    validateCoupon: builder.mutation<
      ApiResponse<CouponValidateResult>,
      CouponValidateInput
    >({
      query: (body) => ({
        url: "/coupons/validate",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true },
    }),
    previewCheckout: builder.mutation<
      ApiResponse<CheckoutPreview>,
      CheckoutInput
    >({
      query: (body) => ({
        url: "/customer/checkout/preview",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true },
    }),
    requestCheckoutOtp: builder.mutation<
      ApiResponse<CheckoutOtpResult>,
      CheckoutInput
    >({
      query: (body) => ({
        url: "/customer/checkout/otp",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true },
    }),
    placeOrder: builder.mutation<
      ApiResponse<PlaceOrderResult>,
      PlaceOrderInput
    >({
      query: (body) => ({
        url: "/customer/checkout",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true },
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),
    previewGuestCheckout: builder.mutation<
      ApiResponse<CheckoutPreview>,
      GuestCheckoutInput
    >({
      query: (body) => ({
        url: "/checkout/guest/preview",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
    }),
    requestGuestCheckoutOtp: builder.mutation<
      ApiResponse<CheckoutOtpResult>,
      GuestCheckoutInput
    >({
      query: (body) => ({
        url: "/checkout/guest/otp",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
    }),
    placeGuestOrder: builder.mutation<
      ApiResponse<PlaceOrderResult>,
      PlaceGuestOrderInput
    >({
      query: (body) => ({
        url: "/checkout/guest",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
    }),
    getCustomerOrders: builder.query<
      CustomerOrdersResponse,
      CustomerOrderListParams | void
    >({
      query: (params) => ({
        url: `/customer/orders${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          search: params?.search,
          status: params?.status,
        })}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true },
      transformResponse: (
        response: ApiResponse<PlaceOrderResult[] | null> | CustomerOrdersResponse,
      ): CustomerOrdersResponse => {
        const data = Array.isArray(response.data) ? response.data : [];
        return {
          ...response,
          data,
          meta: normalizePaginationMeta(response.meta, data.length),
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({ type: "Order" as const, id })),
              { type: "Order", id: "LIST" },
            ]
          : [{ type: "Order", id: "LIST" }],
    }),
    getOrderById: builder.query<ApiResponse<PlaceOrderResult>, string>({
      query: (id) => ({
        url: `/customer/orders/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true },
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    getGuestOrderById: builder.query<ApiResponse<PlaceOrderResult>, string>({
      query: (id) => ({
        url: `/guest/orders/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    cancelCustomerOrder: builder.mutation<ApiResponse<PlaceOrderResult>, string>(
      {
        query: (id) => ({
          url: `/customer/orders/${encodeURIComponent(id)}/cancel`,
          method: "POST",
        }),
        extraOptions: { skipErrorToast: true },
        invalidatesTags: (_r, _e, id) => [
          { type: "Order", id },
          { type: "Order", id: "LIST" },
        ],
      },
    ),
    lookupGuestOrder: builder.mutation<
      ApiResponse<PlaceOrderResult>,
      { orderNumber: string; email: string }
    >({
      query: (body) => ({
        url: "/guest/orders/lookup",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
    }),
  }),
});

export const {
  useGetDeliveryMethodsQuery,
  useValidateCouponMutation,
  usePreviewCheckoutMutation,
  useRequestCheckoutOtpMutation,
  usePlaceOrderMutation,
  useGetCustomerOrdersQuery,
  usePreviewGuestCheckoutMutation,
  useRequestGuestCheckoutOtpMutation,
  usePlaceGuestOrderMutation,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useGetGuestOrderByIdQuery,
  useLookupGuestOrderMutation,
  useCancelCustomerOrderMutation,
} = checkoutApi;
