import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";
import {
  normalizeReview,
  summaryAverage,
  summaryTotal,
  type Review,
  type ReviewSummary,
} from "@/lib/reviews";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
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

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  errors: unknown;
  meta: PaginationMeta | unknown;
};

export type ProductReviewsQuery = {
  productId: string;
  page?: number;
  limit?: number;
  rating?: number;
  sort?: "newest" | "helpful" | "rating_high" | "rating_low";
};

export type CreateProductReviewInput = {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
};

export type CreateGuestReviewInput = {
  orderId: string;
  email: string;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
};

function toReviewQueryString(params: Omit<ProductReviewsQuery, "productId">): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.rating) search.set("rating", String(params.rating));
  if (params.sort) search.set("sort", params.sort);
  const query = search.toString();
  return query ? `?${query}` : "";
}

function normalizeReviewList(
  response: ApiListResponse<unknown>,
): ApiListResponse<Review> {
  const data = Array.isArray(response.data)
    ? response.data
        .map((item) => normalizeReview(item))
        .filter((item): item is Review => item !== null)
    : [];
  return { ...response, data };
}

function fallbackReview(raw: unknown): Review {
  return (
    normalizeReview(raw) ?? {
      id: "",
      productId: "",
      userId: null,
      rating: 0,
      title: null,
      body: null,
      status: "PENDING",
      isVerifiedPurchase: true,
      helpfulCount: 0,
      viewerHasVotedHelpful: false,
      author: {
        id: null,
        firstName: "",
        lastName: "",
        avatar: null,
        role: "GUEST",
      },
      images: [],
      replies: [],
      createdAt: "",
      updatedAt: "",
    }
  );
}

function normalizeReviewResponse(
  response: ApiResponse<unknown>,
): ApiResponse<Review> {
  return { ...response, data: fallbackReview(response.data) };
}

function normalizeSummaryResponse(
  response: ApiResponse<ReviewSummary | null | undefined>,
): ApiResponse<ReviewSummary> {
  const data = response.data ?? { averageRating: 0, totalReviews: 0 };
  return {
    ...response,
    data: {
      ...data,
      averageRating: summaryAverage(data),
      totalReviews: summaryTotal(data),
    },
  };
}

export const reviewApi = createApi({
  reducerPath: "reviewApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["ProductReview", "ProductReviewSummary"],
  endpoints: (builder) => ({
    getProductReviews: builder.query<ApiListResponse<Review>, ProductReviewsQuery>({
      query: ({ productId, ...params }) => ({
        url: `/products/${encodeURIComponent(productId)}/reviews${toReviewQueryString(params)}`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      transformResponse: normalizeReviewList,
      providesTags: (result, _error, arg) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({
                type: "ProductReview" as const,
                id,
              })),
              { type: "ProductReview", id: arg.productId },
            ]
          : [{ type: "ProductReview", id: arg.productId }],
    }),
    getProductReviewSummary: builder.query<ApiResponse<ReviewSummary>, string>({
      query: (productId) => ({
        url: `/products/${encodeURIComponent(productId)}/reviews/summary`,
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      transformResponse: normalizeSummaryResponse,
      providesTags: (_result, _error, productId) => [
        { type: "ProductReviewSummary", id: productId },
      ],
    }),
    createProductReview: builder.mutation<
      ApiResponse<Review>,
      CreateProductReviewInput
    >({
      query: ({ productId, ...body }) => ({
        url: `/products/${encodeURIComponent(productId)}/reviews`,
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true },
      transformResponse: normalizeReviewResponse,
      invalidatesTags: (_result, _error, arg) => [
        { type: "ProductReview", id: arg.productId },
        { type: "ProductReviewSummary", id: arg.productId },
      ],
    }),
    createGuestReview: builder.mutation<
      ApiResponse<Review>,
      CreateGuestReviewInput
    >({
      query: ({ orderId, ...body }) => ({
        url: `/guest/orders/${encodeURIComponent(orderId)}/reviews`,
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true, skipAuthLogout: true },
      transformResponse: normalizeReviewResponse,
      invalidatesTags: (_result, _error, arg) => [
        { type: "ProductReview", id: arg.productId },
        { type: "ProductReviewSummary", id: arg.productId },
      ],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useGetProductReviewSummaryQuery,
  useCreateProductReviewMutation,
  useCreateGuestReviewMutation,
} = reviewApi;
