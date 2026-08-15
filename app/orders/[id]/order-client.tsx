"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useGetOrderByIdQuery,
  type PlaceOrderResult,
} from "@/app/store/checkoutAPI";
import { selectCustomerAccessToken } from "@/app/store/customerAuthSlice";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { formatPrice } from "@/lib/data";
import { readLastPlacedOrder } from "@/lib/order/lastOrder";
import { maskPhone, resolveOrderNotifyPhone } from "@/lib/phone";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { OrderTrackingDetails } from "@/components/order-tracking";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function OrderClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const placed = searchParams.get("placed") === "1";
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectCustomerAccessToken);

  const cachedOrder = useMemo(() => readLastPlacedOrder(id), [id]);
  const [guestOrder] = useState<PlaceOrderResult | null>(cachedOrder);

  const { data, isLoading, isError, error } = useGetOrderByIdQuery(id, {
    skip: !accessToken,
  });

  const order = data?.data ?? guestOrder;
  const notifyPhone = resolveOrderNotifyPhone(order);
  const maskedNotifyPhone = notifyPhone ? maskPhone(notifyPhone) : null;

  const downloadInvoice = async () => {
    if (!accessToken || !order) return;
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

  const showLoading = Boolean(accessToken) && isLoading && !order;
  const showMissing =
    !order && (!accessToken || isError || (!isLoading && !data));

  return (
    <>
      <Header />
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          {showLoading ? (
            <p className="text-center text-sm text-slate-500">Loading order…</p>
          ) : showMissing ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-slate-600">
                {(error as { data?: { message?: string } })?.data?.message ||
                  "Order not found."}
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white"
              >
                Back to shop
              </Link>
            </div>
          ) : order ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {placed && (
                <p className="mb-4 rounded-full bg-emerald-50 px-4 py-2 text-center text-sm font-semibold text-emerald-700">
                  Thank you — your order was placed successfully.
                </p>
              )}
              {placed && maskedNotifyPhone ? (
                <p className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-center text-sm text-brand-900">
                  We’ll send order updates to WhatsApp at {maskedNotifyPhone}.
                </p>
              ) : null}

              <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-gold-400" />
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-950">
                Order {order.orderNumber}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Status:{" "}
                <span className="font-bold text-brand-800">{order.status}</span>
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
              {order.guestEmail && (
                <p className="mt-1 text-sm text-slate-500">
                  Confirmation sent to {order.guestEmail}
                  {order.guestPhone ? ` · ${order.guestPhone}` : ""}
                </p>
              )}

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
                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Shipping ({order.deliveryMethodName})
                  </dt>
                  <dd className="font-semibold">
                    {formatPrice(order.shippingAmount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tax</dt>
                  <dd className="font-semibold">
                    {formatPrice(order.taxAmount)}
                  </dd>
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

              <OrderTrackingDetails
                className="mt-8"
                courier={order.courier}
                trackingNumber={order.trackingNumber}
                trackingUrl={order.trackingUrl}
              />

              <div className="mt-8 flex flex-wrap gap-3">
                {accessToken && (
                  <button
                    type="button"
                    onClick={() => void downloadInvoice()}
                    className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
                  >
                    Download invoice
                  </button>
                )}
                <Link
                  href="/"
                  className="rounded-full border-2 border-brand-900/15 px-5 py-2.5 text-sm font-semibold text-brand-900 hover:border-brand-700"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
