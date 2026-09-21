"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useGetCustomerOrdersQuery,
  type PlaceOrderResult,
} from "@/app/store/checkoutAPI";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { formatPrice } from "@/lib/data";
import {
  ORDER_STATUSES,
  orderStatusLabel,
  type OrderStatus,
} from "@/lib/order/status";

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusTone(status: string) {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-800";
    case "SHIPPED":
    case "CONFIRMED":
      return "bg-brand-50 text-brand-800";
    case "PENDING":
      return "bg-amber-50 text-amber-800";
    case "CANCELLED":
    case "RETURNED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function itemSummary(order: PlaceOrderResult) {
  const items = order.items ?? [];
  const names = items.map((item) => item.productName).filter(Boolean);
  if (names.length === 0) {
    return `${items.length} item${items.length === 1 ? "" : "s"}`;
  }
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]} and ${names.length - 1} more`;
}

export default function AccountOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCustomerOrdersQuery({
      page,
      limit,
      search: search || undefined,
      status: statusFilter || undefined,
    });

  const orders = data?.data ?? [];
  const meta = data?.meta;
  const hasFilters = Boolean(search || statusFilter);

  const errorMessage = useMemo(() => {
    if (!isError) return null;
    return getFetchErrorMessage(
      error as { status?: number | string; data?: unknown },
      "Could not load your orders.",
    );
  }, [error, isError]);

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div>
      <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-brand-400" />
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-950">
        Orders
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Track, review, and reopen orders placed on this account.
      </p>

      <form
        onSubmit={onSearch}
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by order number"
          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none placeholder:text-slate-400 focus:border-brand-400 sm:max-w-xs"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={statusFilter === ""}
          onClick={() => {
            setStatusFilter("");
            setPage(1);
          }}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            statusFilter === ""
              ? "bg-brand-900 text-white"
              : "border border-slate-200 bg-white text-brand-900 hover:border-brand-300"
          }`}
        >
          All
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={statusFilter === status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === status
                ? "bg-brand-900 text-white"
                : "border border-slate-200 bg-white text-brand-900 hover:border-brand-300"
            }`}
          >
            {orderStatusLabel(status)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-slate-500">Loading orders…</p>
      ) : errorMessage ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 inline-flex rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-600">
            {hasFilters
              ? "No orders match this search."
              : "You have not placed any orders yet."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className={`mt-8 space-y-4 ${isFetching ? "opacity-70" : ""}`}>
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-200 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-extrabold text-brand-950">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatOrderDate(order.createdAt)}
                      </p>
                      <p className="mt-2 truncate text-sm text-slate-600">
                        {itemSummary(order)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${statusTone(order.status)}`}
                      >
                        {orderStatusLabel(order.status)}
                      </span>
                      <p className="mt-3 font-display text-xl font-extrabold text-brand-950">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {meta && meta.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!meta.hasPreviousPage || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!meta.hasNextPage || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
