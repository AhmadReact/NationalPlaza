"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminPanel,
  AdminTable,
  StatusPill,
} from "@/components/admin/ui";
import {
  EMAIL_FILTER_STATUSES,
  EMAIL_NOTIFICATION_TYPES,
  useGetEmailNotificationsQuery,
  useRetryEmailNotificationMutation,
  type EmailNotification,
  type EmailNotificationStatus,
  type EmailNotificationType,
} from "@/app/admin/(panel)/email/store/emailAPI";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch } from "@/lib/store/hooks";

function statusTone(status: string) {
  switch (status.toUpperCase()) {
    case "SENT":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "FAILED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function formatDate(value: string) {
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

function canRetry(item: EmailNotification) {
  return item.status !== "SENT" && Boolean(item.orderId);
}

export function EmailNotificationsPanel({
  orderId,
}: {
  orderId?: string;
}) {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    EmailNotificationStatus | ""
  >("");
  const [typeFilter, setTypeFilter] = useState<EmailNotificationType | "">("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [rowOverrides, setRowOverrides] = useState<
    Record<string, EmailNotification>
  >({});
  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [orderId]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetEmailNotificationsQuery({
      page,
      limit,
      search: search || undefined,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      orderId: orderId || undefined,
    });

  const [retryNotification] = useRetryEmailNotificationMutation();

  const items = (data?.data ?? []).map((item) => rowOverrides[item.id] ?? item);
  const meta = data?.meta;
  const hasActiveFilters = Boolean(
    search || statusFilter || typeFilter || orderId,
  );

  const listError = useMemo(() => {
    if (!isError) return null;
    return getFetchErrorMessage(
      error as { status?: number | string; data?: unknown },
      "Failed to load email notifications.",
    );
  }, [error, isError]);

  async function onRetry(id: string) {
    setRetryingId(id);
    try {
      const result = await retryNotification(id).unwrap();
      if (result.data) {
        setRowOverrides((prev) => ({ ...prev, [id]: result.data }));
      }
      dispatch(toast.success(result.message || "Email retry requested."));
    } catch (err) {
      dispatch(
        toast.error(
          getFetchErrorMessage(
            err as { status?: number | string; data?: unknown },
            "Could not retry the email notification.",
          ),
        ),
      );
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <AdminPanel
      title={
        meta
          ? `${meta.total} notification${meta.total === 1 ? "" : "s"}`
          : "Notifications"
      }
      action={
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-60"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      }
    >
      <div className="mb-4 flex flex-col gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
          className="flex w-full max-w-lg items-center gap-2"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order number or email…"
            className="w-full rounded-xl border-2 border-brand-900/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:bg-white"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Search
          </button>
        </form>

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
            All statuses
          </button>
          {EMAIL_FILTER_STATUSES.map((status) => (
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

        <label className="flex max-w-xs items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Type
          </span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value as EmailNotificationType | "");
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All types</option>
            {EMAIL_NOTIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        {orderId ? (
          <p className="text-xs text-slate-500">
            Filtered to this order.{" "}
            <Link
              href="/admin/email"
              className="font-semibold text-brand-800 hover:underline"
            >
              Clear order filter
            </Link>
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Loading notifications…
        </p>
      ) : null}

      {listError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm font-medium text-red-700">{listError}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-sm font-semibold text-brand-800 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!isLoading && !listError && items.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          {hasActiveFilters
            ? "No notifications match your filters."
            : "No email notifications yet."}
        </p>
      ) : null}

      {!isLoading && !listError && items.length > 0 ? (
        <>
          <AdminTable
            columns={[
              "When",
              "Type",
              "Order",
              "Recipient",
              "Status",
              "Actions",
            ]}
            rows={items.map((item) => {
              return [
                <span key={`${item.id}-when`} className="whitespace-nowrap">
                  {formatDate(item.sentAt || item.createdAt)}
                </span>,
                <div key={`${item.id}-type`}>
                  <p className="font-medium text-brand-950">{item.type}</p>
                  <p
                    className="mt-0.5 max-w-xs truncate text-xs text-slate-500"
                    title={item.subject}
                  >
                    {item.subject}
                  </p>
                  {item.errorMessage ? (
                    <p
                      className="mt-0.5 max-w-xs truncate text-xs text-red-600"
                      title={item.errorMessage}
                    >
                      {item.errorMessage}
                    </p>
                  ) : null}
                </div>,
                item.orderId ? (
                  <Link
                    key={`${item.id}-order`}
                    href={`/admin/orders?orderId=${encodeURIComponent(item.orderId)}`}
                    className="font-semibold text-brand-800 hover:underline"
                    title={item.orderNumber ?? item.orderId}
                  >
                    {item.orderNumber || "View order"}
                  </Link>
                ) : (
                  <span key={`${item.id}-order`} className="text-slate-400">
                    {item.orderNumber || "—"}
                  </span>
                ),
                item.recipient || "—",
                <div key={`${item.id}-status`}>
                  <StatusPill
                    label={item.status}
                    tone={statusTone(item.status)}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {item.attempts} attempt{item.attempts === 1 ? "" : "s"}
                  </p>
                </div>,
                canRetry(item) ? (
                  <button
                    key={`${item.id}-retry`}
                    type="button"
                    disabled={retryingId === item.id}
                    onClick={() => void onRetry(item.id)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-60"
                  >
                    {retryingId === item.id ? "Retrying…" : "Retry"}
                  </button>
                ) : (
                  <span key={`${item.id}-retry`} className="text-slate-300">
                    —
                  </span>
                ),
              ];
            })}
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
  );
}
