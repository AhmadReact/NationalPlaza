"use client";

import { useEffect, useState } from "react";
import { loadCart } from "@/app/store/cartThunk";
import { hideSnackbar } from "@/lib/store/snackbarSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

/** Loads guest/customer cart once on storefront mount for badge sync. */
export function CartBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(loadCart());
  }, [dispatch]);

  return null;
}

/** Lightweight toast (no MUI) — used on storefront; admin keeps AppSnackbar. */
export function StoreToast() {
  const dispatch = useAppDispatch();
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const isAdmin = pathname.startsWith("/admin");
  const { open, message, severity, autoHideDuration } = useAppSelector(
    (state) => state.snackbar,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !open || isAdmin) return;
    const timer = window.setTimeout(() => {
      dispatch(hideSnackbar());
    }, autoHideDuration);
    return () => window.clearTimeout(timer);
  }, [open, autoHideDuration, dispatch, message, isAdmin, mounted]);

  if (!mounted || isAdmin || !open || !message) return null;

  const tone =
    severity === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : severity === "error"
        ? "border-red-200 bg-red-50 text-red-900"
        : severity === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-slate-200 bg-white text-slate-800";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[100] max-w-sm"
    >
      <div
        className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${tone}`}
      >
        <p className="flex-1 text-sm font-semibold leading-snug">{message}</p>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => dispatch(hideSnackbar())}
          className="shrink-0 rounded-full px-1.5 text-lg leading-none opacity-60 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
