"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, type FieldProps } from "formik";
import { getAccessToken, getAuthUser } from "@/app/admin/login/store/loginAPI";
import { clearAuthError, logout } from "@/app/admin/login/store/authSlice";
import { loginThunk } from "@/app/admin/login/store/loginThunk";
import { setAdminSessionCookie } from "@/app/admin/actions";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";
import { isStaff } from "@/lib/rbac";

const DEMO_LOGIN = {
  email: "admin@example.com",
  password: "Admin123!",
} as const;

type LoginFormValues = {
  email: string;
  password: string;
};

function validate(values: LoginFormValues) {
  const errors: Partial<Record<keyof LoginFormValues, string>> = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  return errors;
}

export function AdminLoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);
  const pending = status === "loading";

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-800)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_var(--color-gold-500)_0%,_transparent_40%)] opacity-[0.18]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#0e1650_0%,#1d2f8b_45%,#244eec_100%)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-950 font-display text-xl font-extrabold text-gold-400 shadow-lg shadow-brand-950/40">
              N
            </span>
            <span className="text-left leading-tight">
              <span className="block font-display text-xl font-extrabold tracking-tight text-white">
                National <span className="text-brand-200">Electronics</span>
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">
                Admin Panel
              </span>
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/95 p-7 shadow-2xl shadow-brand-950/40 backdrop-blur">
          <h1 className="font-display text-2xl font-bold text-brand-950">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage products, orders, and store settings.
          </p>

          <Formik<LoginFormValues>
            initialValues={{
              email: DEMO_LOGIN.email,
              password: DEMO_LOGIN.password,
            }}
            validate={validate}
            onSubmit={async (values, helpers) => {
              dispatch(clearAuthError());

              const result = await dispatch(
                loginThunk({
                  email: values.email.trim(),
                  password: values.password,
                }),
              );

              if (loginThunk.fulfilled.match(result)) {
                const user = getAuthUser(result.payload);
                if (!isStaff(user)) {
                  dispatch(logout());
                  dispatch(
                    toast.error(
                      "This account is for the storefront. Sign in from the shop.",
                    ),
                  );
                  helpers.setSubmitting(false);
                  return;
                }

                const token =
                  getAccessToken(result.payload) ??
                  values.email.trim() ??
                  "authenticated";

                await setAdminSessionCookie(token);
                dispatch(
                  toast.success(result.payload.message || "Login successful"),
                );
                helpers.setSubmitting(false);
                router.replace("/admin");
                router.refresh();
                return;
              }

              const message =
                (loginThunk.rejected.match(result) && result.payload) ||
                "Invalid email or password.";
              dispatch(toast.error(message));
              helpers.setSubmitting(false);
            }}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-semibold text-brand-950"
                  >
                    Email
                  </label>
                  <Field name="email">
                    {({ field }: FieldProps) => (
                      <input
                        {...field}
                        id="email"
                        type="email"
                        autoComplete="username"
                        className="w-full rounded-xl border-2 border-brand-900/10 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:bg-white"
                        placeholder="admin@example.com"
                      />
                    )}
                  </Field>
                  {touched.email && errors.email ? (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-semibold text-brand-950"
                  >
                    Password
                  </label>
                  <Field name="password">
                    {({ field }: FieldProps) => (
                      <input
                        {...field}
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        className="w-full rounded-xl border-2 border-brand-900/10 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:bg-white"
                        placeholder="••••••••"
                      />
                    )}
                  </Field>
                  {touched.password && errors.password ? (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={pending || isSubmitting}
                  className="flex w-full items-center justify-center rounded-xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                >
                  {pending || isSubmitting
                    ? "Signing in…"
                    : "Sign in to dashboard"}
                </button>
              </Form>
            )}
          </Formik>

          <p className="mt-5 rounded-xl bg-brand-50 px-3 py-2.5 text-center text-xs text-brand-800">
            API: <span className="font-semibold">{DEMO_LOGIN.email}</span> /{" "}
            <span className="font-semibold">{DEMO_LOGIN.password}</span>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-brand-100/80">
          <Link href="/" className="hover:text-gold-300 transition-colors">
            ← Back to storefront
          </Link>
        </p>
      </div>
    </div>
  );
}
