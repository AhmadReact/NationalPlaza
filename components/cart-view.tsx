"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/data";
import {
  clearCart,
  loadCart,
  removeCartItem,
  updateCartItem,
} from "@/app/store/cartThunk";
import { selectCart, selectCartStatus } from "@/app/store/cartSlice";
import { selectCustomerIsAuthenticated } from "@/app/store/customerAuthSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useEffect } from "react";

export function CartView() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const status = useAppSelector(selectCartStatus);
  const isAuthenticated = useAppSelector(selectCustomerIsAuthenticated);
  const loading = status === "loading";

  useEffect(() => {
    void dispatch(loadCart());
  }, [dispatch]);

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-brand-400" />
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-950">
            Your Cart
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEmpty
              ? "No items yet"
              : `${cart?.itemCount ?? 0} item${(cart?.itemCount ?? 0) === 1 ? "" : "s"}`}
          </p>
        </div>
        {!isEmpty && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void dispatch(clearCart())}
            className="text-sm font-semibold text-slate-500 underline-offset-2 hover:text-red-600 hover:underline disabled:opacity-50"
          >
            Clear cart
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-600">Your cart is empty.</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.product.slug || item.productId}`}
                    className="font-semibold text-brand-950 hover:text-brand-700"
                  >
                    {item.product.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    SKU: {item.product.sku}
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-900">
                    {formatPrice(item.unitPrice)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center overflow-hidden rounded-full border-2 border-slate-200">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={loading}
                      onClick={() =>
                        void dispatch(
                          updateCartItem({
                            productId: item.productId,
                            quantity: Math.max(0, item.quantity - 1),
                          }),
                        )
                      }
                      className="px-3 py-1.5 text-lg font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={loading || item.quantity >= item.product.stock}
                      onClick={() =>
                        void dispatch(
                          updateCartItem({
                            productId: item.productId,
                            quantity: item.quantity + 1,
                          }),
                        )
                      }
                      className="px-3 py-1.5 text-lg font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <p className="min-w-20 text-right font-display text-base font-extrabold text-brand-950">
                    {formatPrice(item.lineTotal)}
                  </p>

                  <button
                    type="button"
                    aria-label="Remove item"
                    disabled={loading}
                    onClick={() =>
                      void dispatch(
                        removeCartItem({ productId: item.productId }),
                      )
                    }
                    className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-extrabold text-brand-950">
              Order summary
            </h2>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-bold text-brand-950">
                {formatPrice(cart?.subtotal ?? 0)}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Shipping and tax calculated at checkout.
            </p>
            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-full bg-brand-900 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
            >
              Proceed to checkout
            </Link>
            {!isAuthenticated && (
              <p className="mt-3 text-center text-xs text-slate-500">
                Have an account?{" "}
                <Link
                  href="/login?next=/checkout"
                  className="font-semibold text-brand-700 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to use saved addresses
              </p>
            )}
            <Link
              href="/"
              className="mt-3 flex w-full items-center justify-center rounded-full border-2 border-slate-200 py-3 text-sm font-semibold text-brand-900 hover:border-brand-700"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
