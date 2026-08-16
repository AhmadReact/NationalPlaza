"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { customerLoginThunk } from "@/app/store/customerAuthThunk";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/cart";
  return raw;
}

export default function LoginClient() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const fromOrder = next.startsWith("/orders/");
  const status = useAppSelector((s) => s.customerAuth.status);
  const error = useAppSelector((s) => s.customerAuth.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const pending = status === "loading";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await dispatch(customerLoginThunk({ email, password }));
    if (customerLoginThunk.fulfilled.match(result)) {
      router.replace(next);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-950">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {fromOrder
              ? "Sign in to view this order. Guest confirmation emails do not need an account."
              : "Sign in to checkout. Guest cart items merge automatically."}
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Email
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

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={pending}
              className="w-full rounded-full bg-brand-900 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {fromOrder ? (
            <p className="mt-6 text-center text-sm text-slate-500">
              Ordered as a guest?{" "}
              <Link
                href="/track-order"
                className="font-semibold text-brand-700 hover:underline"
              >
                Track with order number and email
              </Link>
            </p>
          ) : (
            <p className="mt-6 text-center text-sm text-slate-500">
              New here?{" "}
              <Link
                href={`/register?next=${encodeURIComponent(next)}`}
                className="font-semibold text-brand-700 hover:underline"
              >
                Create an account
              </Link>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
