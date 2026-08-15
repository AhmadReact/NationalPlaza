import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: CartProduct;
  createdAt: string;
  updatedAt: string;
};

export type Cart = {
  id: string;
  userId: string | null;
  guestToken: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiCartResponse = {
  success: boolean;
  message: string;
  data: Cart;
  errors: unknown;
  meta: unknown;
};

export type AddCartItemInput = {
  productId: string;
  quantity?: number;
};

export type UpdateCartItemInput = {
  productId: string;
  quantity: number;
};

export type GuestCartItemInput = AddCartItemInput & {
  guestToken: string;
};

export type GuestUpdateCartItemInput = UpdateCartItemInput & {
  guestToken: string;
};

export type GuestCartPath = {
  guestToken: string;
};

export type MergeCartInput = {
  guestToken: string;
};

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    // ── Guest ──────────────────────────────────────────────────────
    createGuestCart: builder.mutation<ApiCartResponse, void>({
      query: () => ({
        url: "/cart/guest",
        method: "POST",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),
    getGuestCart: builder.query<ApiCartResponse, string>({
      query: (guestToken) => ({
        url: `/cart/guest/${encodeURIComponent(guestToken)}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      providesTags: ["Cart"],
    }),
    addGuestCartItem: builder.mutation<ApiCartResponse, GuestCartItemInput>({
      query: ({ guestToken, productId, quantity = 1 }) => ({
        url: `/cart/guest/${encodeURIComponent(guestToken)}/items`,
        method: "POST",
        body: { productId, quantity },
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),
    updateGuestCartItem: builder.mutation<
      ApiCartResponse,
      GuestUpdateCartItemInput
    >({
      query: ({ guestToken, productId, quantity }) => ({
        url: `/cart/guest/${encodeURIComponent(guestToken)}/items/${encodeURIComponent(productId)}`,
        method: "PATCH",
        body: { quantity },
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),
    removeGuestCartItem: builder.mutation<
      ApiCartResponse,
      { guestToken: string; productId: string }
    >({
      query: ({ guestToken, productId }) => ({
        url: `/cart/guest/${encodeURIComponent(guestToken)}/items/${encodeURIComponent(productId)}`,
        method: "DELETE",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),
    clearGuestCart: builder.mutation<ApiCartResponse, GuestCartPath>({
      query: ({ guestToken }) => ({
        url: `/cart/guest/${encodeURIComponent(guestToken)}`,
        method: "DELETE",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),

    // ── Customer (JWT) ─────────────────────────────────────────────
    getCustomerCart: builder.query<ApiCartResponse, void>({
      query: () => ({
        url: "/customer/cart",
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      providesTags: ["Cart"],
    }),
    addCustomerCartItem: builder.mutation<ApiCartResponse, AddCartItemInput>({
      query: ({ productId, quantity = 1 }) => ({
        url: "/customer/cart/items",
        method: "POST",
        body: { productId, quantity },
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),
    updateCustomerCartItem: builder.mutation<
      ApiCartResponse,
      UpdateCartItemInput
    >({
      query: ({ productId, quantity }) => ({
        url: `/customer/cart/items/${encodeURIComponent(productId)}`,
        method: "PATCH",
        body: { quantity },
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),
    removeCustomerCartItem: builder.mutation<ApiCartResponse, string>({
      query: (productId) => ({
        url: `/customer/cart/items/${encodeURIComponent(productId)}`,
        method: "DELETE",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),
    clearCustomerCart: builder.mutation<ApiCartResponse, void>({
      query: () => ({
        url: "/customer/cart",
        method: "DELETE",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),
    mergeCustomerCart: builder.mutation<ApiCartResponse, MergeCartInput>({
      query: (body) => ({
        url: "/customer/cart/merge",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useCreateGuestCartMutation,
  useGetGuestCartQuery,
  useLazyGetGuestCartQuery,
  useAddGuestCartItemMutation,
  useUpdateGuestCartItemMutation,
  useRemoveGuestCartItemMutation,
  useClearGuestCartMutation,
  useGetCustomerCartQuery,
  useLazyGetCustomerCartQuery,
  useAddCustomerCartItemMutation,
  useUpdateCustomerCartItemMutation,
  useRemoveCustomerCartItemMutation,
  useClearCustomerCartMutation,
  useMergeCustomerCartMutation,
} = cartApi;
