import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

export type WhatsAppHealth = {
  configured: boolean;
  phoneNumberIdConfigured: boolean;
  businessAccountIdConfigured: boolean;
};

export type WhatsAppTestRequest = {
  phoneNumber: string;
  message: string;
};

export type WhatsAppTestResult = {
  messageId: string | null;
  status: "SENT";
};

export type WhatsAppRetryResult = {
  messageId?: string | null;
  status?: string;
};

export type WhatsAppNotificationStatus =
  | "PENDING"
  | "SENT"
  | "FAILED"
  | "SKIPPED";

export type WhatsAppEventType =
  | "ORDER_CONFIRMATION"
  | "ORDER_PAID"
  | "ORDER_PACKED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "ORDER_RETURNED";

export type WhatsAppNotification = {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  customerId: string | null;
  phoneNumber: string;
  eventType: WhatsAppEventType | string;
  templateName: string | null;
  status: WhatsAppNotificationStatus | string;
  messageId: string | null;
  errorMessage: string | null;
  attempts: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WhatsAppNotificationListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: WhatsAppNotificationStatus | string;
  eventType?: WhatsAppEventType | string;
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

export const WHATSAPP_NOTIFICATION_STATUSES: WhatsAppNotificationStatus[] = [
  "PENDING",
  "SENT",
  "FAILED",
  "SKIPPED",
];

export const WHATSAPP_EVENT_TYPES: WhatsAppEventType[] = [
  "ORDER_CONFIRMATION",
  "ORDER_PAID",
  "ORDER_PACKED",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
  "ORDER_RETURNED",
];

function toQueryString(params: WhatsAppNotificationListParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const DEFAULT_WHATSAPP_TEST_MESSAGE =
  "Test message from National Electronics";

export const whatsappApi = createApi({
  reducerPath: "whatsappApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["WhatsAppHealth", "WhatsAppNotification"],
  endpoints: (builder) => ({
    getWhatsAppHealth: builder.query<ApiResponse<WhatsAppHealth>, void>({
      query: () => ({
        url: "/admin/whatsapp/health",
        method: "GET",
      }),
      providesTags: [{ type: "WhatsAppHealth", id: "STATUS" }],
    }),
    getWhatsAppNotifications: builder.query<
      ApiListResponse<WhatsAppNotification>,
      WhatsAppNotificationListParams | void
    >({
      query: (params) => ({
        url: `/admin/whatsapp/notifications${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          search: params?.search,
          status: params?.status,
          eventType: params?.eventType,
          orderId: params?.orderId,
        })}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({
                type: "WhatsAppNotification" as const,
                id,
              })),
              { type: "WhatsAppNotification", id: "LIST" },
            ]
          : [{ type: "WhatsAppNotification", id: "LIST" }],
    }),
    sendWhatsAppTest: builder.mutation<
      ApiResponse<WhatsAppTestResult>,
      WhatsAppTestRequest
    >({
      query: (body) => ({
        url: "/admin/whatsapp/test",
        method: "POST",
        body,
      }),
      extraOptions: { skipErrorToast: true },
    }),
    retryWhatsAppNotification: builder.mutation<
      ApiResponse<WhatsAppRetryResult | null>,
      string
    >({
      query: (id) => ({
        url: `/admin/whatsapp/notifications/${encodeURIComponent(id)}/retry`,
        method: "POST",
      }),
      extraOptions: { skipErrorToast: true },
      invalidatesTags: (_result, _error, id) => [
        { type: "WhatsAppNotification", id },
        { type: "WhatsAppNotification", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetWhatsAppHealthQuery,
  useGetWhatsAppNotificationsQuery,
  useSendWhatsAppTestMutation,
  useRetryWhatsAppNotificationMutation,
} = whatsappApi;
