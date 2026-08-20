import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

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

export type DeliveryMethod = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  isActive: boolean;
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
  shippingAmount: number;
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

export type PlaceOrderResult = CheckoutPreview & {
  id: string;
  orderNumber: string;
  status: string;
  notes: string | null;
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

export const checkoutApi = createApi({
  reducerPath: "checkoutApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Address", "DeliveryMethod", "Order"],
  endpoints: (builder) => ({
    getAddresses: builder.query<ApiListResponse<Address>, void>({
      query: () => ({ url: "/customer/addresses", method: "GET" }),
      providesTags: ["Address"],
    }),
    createAddress: builder.mutation<ApiResponse<Address>, CreateAddressInput>({
      query: (body) => ({
        url: "/customer/addresses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Address"],
    }),
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
  useGetAddressesQuery,
  useCreateAddressMutation,
  useGetDeliveryMethodsQuery,
  useValidateCouponMutation,
  usePreviewCheckoutMutation,
  useRequestCheckoutOtpMutation,
  usePlaceOrderMutation,
  usePreviewGuestCheckoutMutation,
  useRequestGuestCheckoutOtpMutation,
  usePlaceGuestOrderMutation,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useGetGuestOrderByIdQuery,
  useLookupGuestOrderMutation,
} = checkoutApi;
