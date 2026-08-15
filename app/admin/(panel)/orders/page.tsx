"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  StatusPill,
} from "@/components/admin/ui";
import {
  ORDER_STATUSES,
  useGetOrderByIdQuery,
  useGetOrdersQuery,
  useGetOrderStatusesQuery,
  useUpdateOrderStatusMutation,
  type AddressSnapshot,
  type Order,
  type OrderStatus,
} from "@/app/admin/(panel)/orders/store/orderAPI";
import { formatPrice } from "@/lib/data";
import { canAccessWhatsAppAdmin } from "@/lib/admin-auth";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";
import { OrderTrackingDetails } from "@/components/order-tracking";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const STOCK_RESTORING_STATUSES: OrderStatus[] = ["CANCELLED", "RETURNED"];

function orderTone(status?: string) {
  const normalized = (status ?? "").toUpperCase();
  switch (normalized) {
    case "DELIVERED":
      return "success" as const;
    case "PAID":
    case "PACKED":
    case "SHIPPED":
      return "info" as const;
    case "PENDING":
      return "warning" as const;
    case "CANCELLED":
    case "RETURNED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function customerLabel(order: Order) {
  if (order.guestEmail) {
    return order.guestEmail;
  }
  return order.shippingAddress?.fullName || "—";
}

function formatAddress(address: AddressSnapshot | null | undefined) {
  if (!address) return "—";
  const lines = [
    address.fullName,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
    address.phone ? `Phone: ${address.phone}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }
  if (error && typeof error === "object" && "status" in error) {
    return `Request failed (${String((error as { status?: unknown }).status)})`;
  }
  return fallback;
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const authUser = useAppSelector((state) => state.auth.user);
  const canViewWhatsApp = canAccessWhatsAppAdmin(authUser);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const limit = 20;

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus | "">("");
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [shippingDraft, setShippingDraft] = useState({
    courier: "",
    trackingNumber: "",
    trackingUrl: "",
  });

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetOrdersQuery({
      page,
      limit,
      search: search || undefined,
      status: statusFilter || undefined,
    });

  const { data: statusesData } = useGetOrderStatusesQuery();

  const {
    data: detailData,
    isLoading: isLoadingDetail,
    isFetching: isFetchingDetail,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useGetOrderByIdQuery(selectedOrderId ?? "", {
    skip: !selectedOrderId,
  });

  const [updateOrderStatus, { isLoading: isUpdatingStatus }] =
    useUpdateOrderStatusMutation();

  const orders = data?.data ?? [];
  const meta = data?.meta;
  const order = detailData?.data ?? null;
  const statusMap = statusesData?.data ?? [];

  useEffect(() => {
    const next = detailData?.data;
    if (!next || next.id !== selectedOrderId) return;
    setShippingDraft({
      courier: next.courier ?? "",
      trackingNumber: next.trackingNumber ?? "",
      trackingUrl: next.trackingUrl ?? "",
    });
  }, [selectedOrderId, detailData?.data?.id]);

  const nextStatuses = useMemo(() => {
    if (!order) return [];
    const entry = statusMap.find((item) => item.status === order.status);
    const next = entry?.next ?? [];
    return Array.from(new Set([order.status, ...next]));
  }, [order, statusMap]);

  const selectedStatus = (statusDraft || order?.status) as OrderStatus | "";
  const showShippedForm = selectedStatus === "SHIPPED";

  const listErrorMessage = useMemo(() => {
    if (!isError) return null;
    return getErrorMessage(error, "Failed to load orders.");
  }, [error, isError]);

  const detailErrorMessage = useMemo(() => {
    if (!isDetailError) return null;
    return getErrorMessage(detailError, "Failed to load order.");
  }, [detailError, isDetailError]);

  const hasActiveFilters = Boolean(search || statusFilter);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function openOrder(orderId: string) {
    setSelectedOrderId(orderId);
    setStatusDraft("");
    setConfirmStatus(null);
    setShippingDraft({ courier: "", trackingNumber: "", trackingUrl: "" });
  }

  function closeDetail(force = false) {
    if (isUpdatingStatus && !force) return;
    setSelectedOrderId(null);
    setStatusDraft("");
    setConfirmStatus(null);
    setShippingDraft({ courier: "", trackingNumber: "", trackingUrl: "" });
  }

  function hydrateShipping(nextOrder: Order) {
    setShippingDraft({
      courier: nextOrder.courier ?? "",
      trackingNumber: nextOrder.trackingNumber ?? "",
      trackingUrl: nextOrder.trackingUrl ?? "",
    });
  }

  async function applyStatus(
    nextStatus: OrderStatus,
    extras?: {
      courier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
    },
  ) {
    if (!order) return;

    try {
      const result = await updateOrderStatus({
        id: order.id,
        status: nextStatus,
        ...extras,
      }).unwrap();
      setStatusDraft(result.data.status);
      setConfirmStatus(null);
      hydrateShipping(result.data);

      if (nextStatus === "SHIPPED") {
        dispatch(
          toast.success(
            order.status === "SHIPPED"
              ? "Tracking details saved."
              : "Order marked Shipped. WhatsApp notification will be sent to the customer if a valid number is on file.",
          ),
        );
      } else {
        dispatch(
          toast.success(
            result.message || `Order status updated to ${nextStatus}`,
          ),
        );
      }
    } catch (err) {
      setStatusDraft(order.status);
      setConfirmStatus(null);
      dispatch(
        toast.error(getErrorMessage(err, "Failed to update order status.")),
      );
    }
  }

  function handleStatusChange(nextStatus: OrderStatus) {
    if (!order || nextStatus === order.status) {
      setStatusDraft(nextStatus);
      return;
    }

    setStatusDraft(nextStatus);

    if (nextStatus === "SHIPPED") {
      setConfirmStatus(null);
      return;
    }

    if (STOCK_RESTORING_STATUSES.includes(nextStatus)) {
      setConfirmStatus(nextStatus);
      return;
    }

    void applyStatus(nextStatus);
  }

  function submitShipped() {
    if (!order) return;
    const courier = shippingDraft.courier.trim();
    const trackingNumber = shippingDraft.trackingNumber.trim();
    const trackingUrl = shippingDraft.trackingUrl.trim();

    if (trackingUrl && !isHttpsUrl(trackingUrl)) {
      dispatch(toast.error("Tracking URL must be a public https link."));
      return;
    }

    void applyStatus("SHIPPED", {
      courier: courier || undefined,
      trackingNumber: trackingNumber || undefined,
      trackingUrl: trackingUrl || undefined,
    });
  }

  async function downloadInvoice() {
    if (!order || !accessToken) {
      dispatch(toast.error("You must be signed in to download invoices."));
      return;
    }

    setIsDownloadingInvoice(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/orders/${encodeURIComponent(order.id)}/invoice`,
        {
          headers: {
            authorization: `Bearer ${accessToken}`,
            accept: "application/pdf",
          },
        },
      );
      if (!res.ok) {
        throw new Error("Invoice download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.orderNumber || order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      dispatch(toast.error("Could not download invoice."));
    } finally {
      setIsDownloadingInvoice(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Track and fulfill customer and guest orders."
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full max-w-lg items-center gap-2"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order number…"
              className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-50 disabled:opacity-60"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setStatusFilter("");
            }}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
              statusFilter === ""
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-slate-200 bg-white text-brand-950 hover:bg-brand-50"
            }`}
          >
            All
          </button>
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setPage(1);
                setStatusFilter(status);
              }}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                statusFilter === status
                  ? "border-brand-900 bg-brand-900 text-white"
                  : "border-slate-200 bg-white text-brand-950 hover:bg-brand-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <AdminPanel
        title={
          meta
            ? `${meta.total} order${meta.total === 1 ? "" : "s"}`
            : "All orders"
        }
      >
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading orders…
          </p>
        ) : null}

        {!isLoading && listErrorMessage ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-red-700">
              {listErrorMessage}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 text-sm font-semibold text-brand-800 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !listErrorMessage && orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {hasActiveFilters
              ? "No orders match your filters."
              : "No orders yet."}
          </p>
        ) : null}

        {!isLoading && !listErrorMessage && orders.length > 0 ? (
          <>
            <AdminTable
              columns={[
                "Order",
                "Customer",
                "Total",
                "Status",
                "Date",
                "Actions",
              ]}
              rows={orders.map((item) => [
                <div key={item.id}>
                  <span className="font-semibold text-brand-950">
                    {item.orderNumber}
                  </span>
                  {item.guestEmail ? (
                    <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Guest
                    </span>
                  ) : null}
                </div>,
                <div key={`${item.id}-customer`} className="min-w-0">
                  <p className="truncate font-medium text-brand-950">
                    {customerLabel(item)}
                  </p>
                  {item.guestEmail && item.guestPhone ? (
                    <p className="truncate text-xs text-slate-500">
                      {item.guestPhone}
                    </p>
                  ) : item.guestEmail ? null : item.shippingAddress?.phone ? (
                    <p className="truncate text-xs text-slate-500">
                      {item.shippingAddress.phone}
                    </p>
                  ) : null}
                </div>,
                formatPrice(item.total),
                <StatusPill
                  key={`${item.id}-status`}
                  label={item.status}
                  tone={orderTone(item.status)}
                />,
                formatOrderDate(item.createdAt),
                <button
                  key={`${item.id}-view`}
                  type="button"
                  onClick={() => openOrder(item.id)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                >
                  View
                </button>,
              ])}
            />

            {meta && meta.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!meta.hasPreviousPage || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!meta.hasNextPage || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </AdminPanel>

      {selectedOrderId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/40 p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => closeDetail()}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-dialog-title"
            className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2
                  id="order-dialog-title"
                  className="font-display text-lg font-bold text-brand-950"
                >
                  {order ? `Order ${order.orderNumber}` : "Order details"}
                </h2>
                {order ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Placed {formatOrderDate(order.createdAt)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => closeDetail()}
                disabled={isUpdatingStatus}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-brand-950 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 p-5">
              {isLoadingDetail && !order ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading order…
                </p>
              ) : null}

              {detailErrorMessage ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-red-700">
                    {detailErrorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchDetail()}
                    className="mt-3 text-sm font-semibold text-brand-800 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : null}

              {order ? (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        label={order.status}
                        tone={orderTone(order.status)}
                      />
                      {order.guestEmail ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          Guest order
                        </span>
                      ) : null}
                      {isFetchingDetail ? (
                        <span className="text-xs text-slate-400">
                          Refreshing…
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </span>
                        <select
                          value={statusDraft || order.status}
                          disabled={isUpdatingStatus || nextStatuses.length === 0}
                          onChange={(e) =>
                            handleStatusChange(e.target.value as OrderStatus)
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-950 outline-none focus:border-brand-600 disabled:opacity-60"
                        >
                          {nextStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={downloadInvoice}
                        disabled={isDownloadingInvoice}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-60"
                      >
                        {isDownloadingInvoice
                          ? "Downloading…"
                          : "Download invoice"}
                      </button>
                      {canViewWhatsApp ? (
                        <Link
                          href={`/admin/whatsapp?orderId=${encodeURIComponent(order.id)}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-brand-950 hover:bg-brand-50"
                        >
                          WhatsApp log
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {(order.guestEmail || order.guestPhone) && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Guest contact
                      </p>
                      {order.guestEmail ? (
                        <p className="mt-1 text-sm font-medium text-brand-950">
                          {order.guestEmail}
                        </p>
                      ) : null}
                      {order.guestPhone ? (
                        <p className="text-sm text-slate-600">
                          {order.guestPhone}
                        </p>
                      ) : null}
                    </div>
                  )}

                  <OrderTrackingDetails
                    courier={order.courier}
                    trackingNumber={order.trackingNumber}
                    trackingUrl={order.trackingUrl}
                  />

                  {showShippedForm ? (
                    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {order.status === "SHIPPED"
                          ? "Update tracking"
                          : "Shipment details"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Courier and tracking are sent with this status update.
                        WhatsApp shipment alerts use these fields.
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="text-xs font-semibold text-slate-600">
                            Courier
                          </span>
                          <input
                            value={shippingDraft.courier}
                            onChange={(e) =>
                              setShippingDraft((prev) => ({
                                ...prev,
                                courier: e.target.value,
                              }))
                            }
                            placeholder="Leopards, TCS, Call Courier…"
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-600">
                            Tracking number
                          </span>
                          <input
                            value={shippingDraft.trackingNumber}
                            onChange={(e) =>
                              setShippingDraft((prev) => ({
                                ...prev,
                                trackingNumber: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-600">
                            Tracking URL
                          </span>
                          <input
                            type="url"
                            value={shippingDraft.trackingUrl}
                            onChange={(e) =>
                              setShippingDraft((prev) => ({
                                ...prev,
                                trackingUrl: e.target.value,
                              }))
                            }
                            placeholder="https://"
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={submitShipped}
                        className="mt-3 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {isUpdatingStatus
                          ? "Saving…"
                          : order.status === "SHIPPED"
                            ? "Save tracking"
                            : "Mark as Shipped"}
                      </button>
                    </div>
                  ) : null}

                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Line items
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Product</th>
                            <th className="px-3 py-2 font-semibold">Qty</th>
                            <th className="px-3 py-2 font-semibold">Unit</th>
                            <th className="px-3 py-2 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr
                              key={`${item.productId}-${item.sku}`}
                              className="border-t border-slate-100"
                            >
                              <td className="px-3 py-2.5">
                                <p className="font-medium text-brand-950">
                                  {item.productName}
                                </p>
                                <p className="font-mono text-xs text-slate-400">
                                  {item.sku}
                                </p>
                              </td>
                              <td className="px-3 py-2.5">{item.quantity}</td>
                              <td className="px-3 py-2.5">
                                {formatPrice(item.unitPrice)}
                              </td>
                              <td className="px-3 py-2.5 font-medium">
                                {formatPrice(item.lineTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Shipping address
                      </h3>
                      <pre className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 font-sans text-sm text-slate-700">
                        {formatAddress(order.shippingAddress)}
                      </pre>
                    </div>
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Billing address
                        {order.billingSameAsShipping
                          ? " (same as shipping)"
                          : ""}
                      </h3>
                      <pre className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 font-sans text-sm text-slate-700">
                        {formatAddress(order.billingAddress)}
                      </pre>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 px-4 py-3">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Subtotal</span>
                        <span>{formatPrice(order.subtotal)}</span>
                      </div>
                      {order.discountAmount > 0 ? (
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">
                            Discount
                            {order.couponCode ? ` (${order.couponCode})` : ""}
                          </span>
                          <span>−{formatPrice(order.discountAmount)}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">
                          Shipping ({order.deliveryMethodName})
                        </span>
                        <span>{formatPrice(order.shippingAmount)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">
                          Tax ({(order.taxRate * 100).toFixed(2)}%)
                        </span>
                        <span>{formatPrice(order.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-slate-100 pt-2 font-semibold text-brand-950">
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  {order.notes?.trim() ? (
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Notes
                      </h3>
                      <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                        {order.notes}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {confirmStatus && order ? (
        <div className="fixed inset-0 z-60 flex items-end justify-center bg-brand-950/40 p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close confirm dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => {
              if (isUpdatingStatus) return;
              setConfirmStatus(null);
              setStatusDraft(order.status);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-status-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="confirm-status-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Mark as {confirmStatus}?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Setting status to{" "}
              <span className="font-semibold text-brand-950">
                {confirmStatus}
              </span>{" "}
              will restore inventory for this order.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => {
                  setConfirmStatus(null);
                  setStatusDraft(order.status);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => applyStatus(confirmStatus)}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isUpdatingStatus ? "Updating…" : `Confirm ${confirmStatus}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
