import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";
import type { OrderStatus } from "@/app/admin/(panel)/orders/store/orderAPI";

export type DashboardPeriodPreset = "7d" | "30d" | "90d" | "12m";
export type DashboardGranularity = "day" | "month";

export type DashboardQueryParams = {
  period?: DashboardPeriodPreset;
  from?: string;
  to?: string;
  limit?: number;
};

export type MetricValue = {
  value: number;
  previous: number;
  changePercent: number | null;
};

export type DashboardSummary = {
  revenue: MetricValue;
  orders: MetricValue;
  customers: MetricValue;
  averageOrderValue: MetricValue;
  lowStockCount: number;
  outOfStockCount: number;
  totalCustomers: number;
  totalProducts: number;
};

export type ChartPoint = {
  date: string;
  value: number;
};

export type DashboardCharts = {
  revenue: ChartPoint[];
  orders: ChartPoint[];
  customers: ChartPoint[];
  ordersByStatus: Array<{
    status: OrderStatus;
    count: number;
  }>;
};

export type TopProduct = {
  productId: string | null;
  productName: string;
  sku: string;
  unitsSold: number;
  revenue: number;
};

export type LowStockItem = {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  lowStock: number;
  deficit: number;
  isOutOfStock: boolean;
};

export type DashboardPeriod = {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  granularity: DashboardGranularity;
};

export type DashboardOverview = {
  period: DashboardPeriod;
  summary: DashboardSummary;
  charts: DashboardCharts;
  topProducts: TopProduct[];
  lowStock: LowStockItem[];
};

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  meta: unknown;
};

function toQueryString(params: DashboardQueryParams | void): string {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      searchParams.set(key, String(value));
    });
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getDashboard: builder.query<
      ApiEnvelope<DashboardOverview>,
      DashboardQueryParams | void
    >({
      query: (params) => ({
        url: `/dashboard${toQueryString({
          period: params?.period ?? "30d",
          from: params?.from,
          to: params?.to,
          limit: params?.limit ?? 10,
        })}`,
        method: "GET",
      }),
      providesTags: [{ type: "Dashboard", id: "OVERVIEW" }],
    }),
    getDashboardSummary: builder.query<
      ApiEnvelope<{ period: DashboardPeriod; summary: DashboardSummary }>,
      DashboardQueryParams | void
    >({
      query: (params) => ({
        url: `/dashboard/summary${toQueryString({
          period: params?.period ?? "30d",
          from: params?.from,
          to: params?.to,
        })}`,
        method: "GET",
      }),
      providesTags: [{ type: "Dashboard", id: "SUMMARY" }],
    }),
    getDashboardCharts: builder.query<
      ApiEnvelope<{
        period: Pick<DashboardPeriod, "from" | "to" | "granularity">;
        charts: DashboardCharts;
      }>,
      DashboardQueryParams | void
    >({
      query: (params) => ({
        url: `/dashboard/charts${toQueryString({
          period: params?.period ?? "30d",
          from: params?.from,
          to: params?.to,
        })}`,
        method: "GET",
      }),
      providesTags: [{ type: "Dashboard", id: "CHARTS" }],
    }),
    getDashboardTopProducts: builder.query<
      ApiEnvelope<{
        period: { from: string; to: string };
        items: TopProduct[];
      }>,
      DashboardQueryParams | void
    >({
      query: (params) => ({
        url: `/dashboard/top-products${toQueryString({
          period: params?.period ?? "30d",
          from: params?.from,
          to: params?.to,
          limit: params?.limit ?? 10,
        })}`,
        method: "GET",
      }),
      providesTags: [{ type: "Dashboard", id: "TOP_PRODUCTS" }],
    }),
    getDashboardLowStock: builder.query<
      ApiEnvelope<LowStockItem[]>,
      { limit?: number } | void
    >({
      query: (params) => ({
        url: `/dashboard/low-stock${toQueryString({
          limit: params?.limit ?? 10,
        })}`,
        method: "GET",
      }),
      providesTags: [{ type: "Dashboard", id: "LOW_STOCK" }],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetDashboardSummaryQuery,
  useGetDashboardChartsQuery,
  useGetDashboardTopProductsQuery,
  useGetDashboardLowStockQuery,
} = dashboardApi;
