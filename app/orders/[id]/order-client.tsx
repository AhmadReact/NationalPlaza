"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCancelCustomerOrderMutation,
  useGetGuestOrderByIdQuery,
  useGetOrderByIdQuery,
} from "@/app/store/checkoutAPI";
import {
  selectCustomerAccessToken,
  selectCustomerUser,
} from "@/app/store/customerAuthSlice";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { OrderStatusTimeline } from "@/components/order-timeline";
import { OrderTrackingDetails } from "@/components/order-tracking";
import { getFetchErrorMessage, isNotFoundError } from "@/lib/api/errorMessage";
import { formatPrice } from "@/lib/data";
import { maskEmail, resolveOrderNotifyEmail } from "@/lib/email";
import { readLastPlacedOrder } from "@/lib/order/lastOrder";
import {
  canCustomerCancel,
  isShippingPending,
  orderStatusLabel,
  pendingShippingCopy,
} from "@/lib/order/status";
import { maskPhone, resolveOrderNotifyPhone } from "@/lib/phone";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function OrderClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const placed = searchParams.get("placed") === "1";
  const dispatch = useAppDispatch();
  const router = useRouter();
  const accessToken = useAppSelector(selectCustomerAccessToken);
  const customerUser = useAppSelector(selectCustomerUser);

  const cachedOrder = useMemo(() => readLastPlacedOrder(id), [id]);

  const {
    data: customerData,
    isLoading: customerLoading,
    isError: customerIsError,
    error: customerError,
  } = useGetOrderByIdQuery(id, {
    skip: !accessToken,
  });

  const customerNotFound =
    Boolean(accessToken) && customerIsError && isNotFoundError(customerError);
  const skipGuest = Boolean(accessToken) && !customerNotFound;

  const {
    data: guestData,
    isLoading: guestLoading,
    isError: guestIsError,
    isUninitialized: guestUninitialized,
    error: guestError,
  } = useGetGuestOrderByIdQuery(id, {
    skip: skipGuest,
  });

  const [cancelCustomerOrder, { isLoading: cancelling }] =
    useCancelCustomerOrderMutation();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const order = customerData?.data ?? guestData?.data ?? cachedOrder;
  const canDownloadInvoice = Boolean(accessToken && customerData?.data);
  const canCancel = Boolean(
    accessToken &&
      customerData?.data &&
      order &&
      canCustomerCancel(order.status),
  );
  const shippingPending = order ? isShippingPending(order) : false;
  const notifyPhone = resolveOrderNotifyPhone(order);
  const maskedNotifyPhone = notifyPhone ? maskPhone(notifyPhone) : null;
  const notifyEmail = resolveOrderNotifyEmail(order, customerUser?.email);
  const maskedNotifyEmail = notifyEmail ? maskEmail(notifyEmail) : null;

  const guestNotFound =
    !skipGuest && guestIsError && isNotFoundError(guestError);
  const redirectingToLogin =
    !accessToken && guestNotFound && !cachedOrder;

  useEffect(() => {
    if (!redirectingToLogin) return;
    router.replace(`/login?next=${encodeURIComponent(`/orders/${id}`)}`);
  }, [id, redirectingToLogin, router]);

  const downloadInvoice = async () => {
    if (!canDownloadInvoice || !accessToken || !order) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/customer/orders/${encodeURIComponent(order.id)}/invoice`,
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
      a.download = `${order.orderNumber || order.id}-invoice.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      dispatch(toast.error("Could not download invoice."));
    }
  };

  const onCancelOrder = async () => {
    if (!canCancel || !order) return;
    try {
      await cancelCustomerOrder(order.id).unwrap();
      setConfirmCancel(false);
      dispatch(toast.success("Order cancelled."));
    } catch (error) {
      dispatch(
        toast.error(
          getFetchErrorMessage(
            error as { status?: number | string; data?: unknown },
            "Could not cancel this order.",
          ),
        ),
      );
    }
  };

  const fetching =
    (Boolean(accessToken) && customerLoading) ||
    (!skipGuest && (guestLoading || guestUninitialized));
  const showLoading = !order && (fetching || redirectingToLogin);
  const showMissing =
    !order &&
    !fetching &&
    !redirectingToLogin &&
    (customerIsError || guestIsError);
  const missingMessage = getFetchErrorMessage(
    (customerError ?? guestError) as
      | { status?: number | string; data?: unknown; error?: string }
      | undefined,
    "Order not found.",
  );

  return (
    <>
      <Header />
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          {showLoading ? (
            <p className="text-center text-sm text-slate-500">Loading order…</p>
          ) : showMissing ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-slate-600">{missingMessage}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link
                  href="/track-order"
                  className="inline-flex rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white"
                >
                  Track with order number
                </Link>
                <Link
                  href="/"
                  className="inline-flex rounded-full border-2 border-brand-900/15 px-5 py-2.5 text-sm font-semibold text-brand-900"
                >
                  Back to shop
                </Link>
              </div>
            </div>
          ) : order ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {placed && (
                <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-emerald-800">
                    Your order has been placed and we will confirm your order.
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Order number:{" "}
                    <span className="font-extrabold">{order.orderNumber}</span>
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    A representative will call with shipping charges.
                  </p>
                </div>
              )}
              {placed && !accessToken ? (
                <p className="mb-4 rounded-2xl border border-gold-200 bg-gold-50 px-4 py-3 text-center text-sm text-brand-950">
                  Save this order number:{" "}
                  <span className="font-extrabold">{order.orderNumber}</span>
                  . You can look it up later with this number and your checkout
                  email.{" "}
                  <Link
                    href="/track-order"
                    className="font-semibold underline decoration-brand-700/40 underline-offset-2 hover:text-brand-700"
                  >
                    Track order
                  </Link>
                </p>
              ) : null}
              {placed && (maskedNotifyEmail || maskedNotifyPhone) ? (
                <p className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-center text-sm text-brand-900">
                  Email and WhatsApp updates are sent in the background
                  {maskedNotifyEmail ? ` to ${maskedNotifyEmail}` : ""}
                  {maskedNotifyPhone
                    ? `${maskedNotifyEmail ? " and WhatsApp at " : " to WhatsApp at "}${maskedNotifyPhone}`
                    : ""}
                  . Delivery of those messages is not instant.
                </p>
              ) : null}

              <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-gold-400" />
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-950">
                Order {order.orderNumber}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Status:{" "}
                <span className="font-bold text-brand-800">
                  {orderStatusLabel(order.status)}
                </span>
                {order.createdAt && (
                  <>
                    {" "}
                    ·{" "}
                    {new Date(order.createdAt).toLocaleString("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </>
                )}
              </p>
              {order.guestEmail && !placed ? (
                <p className="mt-1 text-sm text-slate-500">
                  {order.guestEmail}
                  {order.guestPhone ? ` · ${order.guestPhone}` : ""}
                </p>
              ) : null}

              <ul className="mt-8 space-y-3 border-b border-slate-100 pb-6">
                {order.items.map((item) => (
                  <li
                    key={`${item.productId}-${item.sku}`}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="text-slate-600">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-semibold text-brand-950">
                      {formatPrice(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="font-semibold">
                    {formatPrice(order.subtotal)}
                  </dd>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Discount</dt>
                    <dd className="font-semibold">
                      −{formatPrice(order.discountAmount)}
                    </dd>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Tax</dt>
                    <dd className="font-semibold">
                      {formatPrice(order.taxAmount)}
                    </dd>
                  </div>
                )}
                <div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">
                      Shipping
                      {order.deliveryMethodName
                        ? ` (${order.deliveryMethodName})`
                        : ""}
                    </dt>
                    <dd
                      className={`font-semibold ${
                        shippingPending ? "text-slate-600" : ""
                      }`}
                    >
                      {shippingPending
                        ? pendingShippingCopy(order)
                        : formatPrice(order.shippingAmount)}
                    </dd>
                  </div>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3">
                  <dt className="font-bold text-brand-950">Total</dt>
                  <dd className="font-display text-2xl font-extrabold text-brand-950">
                    {formatPrice(order.total)}
                  </dd>
                </div>
              </dl>

              {order.shippingAddress && (
                <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-bold text-brand-950">Ship to</p>
                  <p className="mt-1">
                    {order.shippingAddress.fullName}
                    <br />
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2
                      ? `, ${order.shippingAddress.line2}`
                      : ""}
                    <br />
                    {order.shippingAddress.city}
                    {order.shippingAddress.state
                      ? `, ${order.shippingAddress.state}`
                      : ""}{" "}
                    {order.shippingAddress.postalCode}
                    <br />
                    {order.shippingAddress.country}
                    {order.shippingAddress.phone
                      ? ` · ${order.shippingAddress.phone}`
                      : ""}
                  </p>
                </div>
              )}

              <OrderStatusTimeline status={order.status} className="mt-8" />

              <OrderTrackingDetails
                className="mt-8"
                courier={order.courier}
                trackingNumber={order.trackingNumber}
                trackingUrl={order.trackingUrl}
              />

              <div className="mt-8 flex flex-wrap gap-3">
                {canDownloadInvoice && (
                  <button
                    type="button"
                    onClick={() => void downloadInvoice()}
                    className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
                  >
                    Download invoice
                  </button>
                )}
                {canCancel && !confirmCancel ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className="rounded-full border-2 border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Cancel order
                  </button>
                ) : null}
                {canCancel && confirmCancel ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-600">
                      Cancel this order?
                    </span>
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => void onCancelOrder()}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {cancelling ? "Cancelling…" : "Yes, cancel"}
                    </button>
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => setConfirmCancel(false)}
                      className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 disabled:opacity-60"
                    >
                      Keep order
                    </button>
                  </div>
                ) : null}
                <Link
                  href="/"
                  className="rounded-full border-2 border-brand-900/15 px-5 py-2.5 text-sm font-semibold text-brand-900 hover:border-brand-700"
                >
                  Continue shopping
                </Link>
                {!canDownloadInvoice ? (
                  <Link
                    href="/track-order"
                    className="rounded-full border-2 border-brand-900/15 px-5 py-2.5 text-sm font-semibold text-brand-900 hover:border-brand-700"
                  >
                    Track another order
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
