import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

export type EmailNotificationType =
  | "ORDER_CONFIRMATION"
  | "ORDER_STATUS"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED";

export type EmailNotificationStatus = "PENDING" | "SENT" | "FAILED";

export type EmailHealth = {
  configured: boolean;
  fromConfigured: boolean;
  replyToConfigured: boolean;
  frontendUrlConfigured: boolean;
};

export type EmailTestRequest = {
  to: string;
  type?: EmailNotificationType;
};

export type EmailTestResult = {
  to: string;
  type: EmailNotificationType;
  subject: string;
  provider: "resend";
  providerMessageId: string | null;
  status: "SENT";
};

export type EmailNotification = {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  customerId: string | null;
  recipient: string;
  type: EmailNotificationType;
  subject: string;
  provider: string;
  providerMessageId: string | null;
  status: EmailNotificationStatus;
  errorMessage: string | null;
  attempts: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmailNotificationListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: EmailNotificationStatus | string;
  type?: EmailNotificationType | string;
  orderId?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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
  meta: PaginationMeta;
};

export const EMAIL_NOTIFICATION_STATUSES: EmailNotificationStatus[] = [
  "PENDING",
  "SENT",
  "FAILED",
];

export const EMAIL_FILTER_STATUSES: EmailNotificationStatus[] = [
  "FAILED",
  "SENT",
];

export const EMAIL_NOTIFICATION_TYPES: EmailNotificationType[] = [
  "ORDER_CONFIRMATION",
  "ORDER_STATUS",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
];

function toQueryString(params: EmailNotificationListParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const emailApi = createApi({
  reducerPath: "emailApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["EmailHealth", "EmailNotification"],
  endpoints: (builder) => ({
    getEmailHealth: builder.query<ApiResponse<EmailHealth>, void>({
      query: () => ({
        url: "/admin/email/health",
        method: "GET",
      }),
      providesTags: [{ type: "EmailHealth", id: "STATUS" }],
    }),
    getEmailNotifications: builder.query<
      ApiListResponse<EmailNotification>,
      EmailNotificationListParams | void
    >({
      query: (params) => ({
        url: `/admin/email/notifications${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          search: params?.search,
          status: params?.status,
          type: params?.type,
          orderId: params?.orderId,
        })}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({
                type: "EmailNotification" as const,
                id,
              })),
              { type: "EmailNotification", id: "LIST" },
            ]
          : [{ type: "EmailNotification", id: "LIST" }],
    }),
    getEmailNotificationById: builder.query<
      ApiResponse<EmailNotification>,
      string
    >({
      query: (id) => ({
        url: `/admin/email/notifications/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "EmailNotification", id },
      ],
    }),
    sendEmailTest: builder.mutation<
      ApiResponse<EmailTestResult>,
      EmailTestRequest
    >({
      query: (body) => ({
        url: "/admin/email/test",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true },
      invalidatesTags: [{ type: "EmailNotification", id: "LIST" }],
    }),
    retryEmailNotification: builder.mutation<
      ApiResponse<EmailNotification>,
      string
    >({
      query: (id) => ({
        url: `/admin/email/notifications/${encodeURIComponent(id)}/retry`,
        method: "POST",
      }),
      extraOptions: { skipErrorToast: true },
      invalidatesTags: (_result, _error, id) => [
        { type: "EmailNotification", id },
        { type: "EmailNotification", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetEmailHealthQuery,
  useGetEmailNotificationsQuery,
  useGetEmailNotificationByIdQuery,
  useSendEmailTestMutation,
  useRetryEmailNotificationMutation,
} = emailApi;
