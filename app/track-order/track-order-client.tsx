"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLookupGuestOrderMutation } from "@/app/store/checkoutAPI";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { isValidEmail } from "@/lib/email";

export default function TrackOrderClient() {
  const router = useRouter();
  const [lookupGuestOrder, { isLoading }] = useLookupGuestOrderMutation();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedNumber = orderNumber.trim();
    const trimmedEmail = email.trim();

    if (!trimmedNumber) {
      setError("Enter the order number from your confirmation.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError("Enter the email you used at checkout.");
      return;
    }

    setError(null);
    try {
      const result = await lookupGuestOrder({
        orderNumber: trimmedNumber,
        email: trimmedEmail,
      }).unwrap();
      router.push(`/orders/${result.data.id}`);
    } catch (lookupError) {
      setError(
        getFetchErrorMessage(
          lookupError as { status?: number | string; data?: unknown },
          "No guest order matched that number and email. If you checked out with an account, sign in to view it.",
        ),
      );
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-950">
            Track order
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Use the order number from your confirmation page or email, plus the
            email you entered at checkout. No account needed.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Order number
              </span>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="ORD-M5K2N1-A9X2"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-600"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Checkout email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-600"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-brand-900 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {isLoading ? "Looking up…" : "Find order"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Ordered with an account?{" "}
            <Link
              href="/login?next=/track-order"
              className="font-semibold text-brand-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
