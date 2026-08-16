"use client";

import { type FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AdminPageHeader,
  AdminPanel,
  StatusPill,
} from "@/components/admin/ui";
import { EmailNotificationsPanel } from "@/app/admin/(panel)/email/notifications-panel";
import {
  EMAIL_NOTIFICATION_TYPES,
  useGetEmailHealthQuery,
  useSendEmailTestMutation,
  type EmailNotificationType,
} from "@/app/admin/(panel)/email/store/emailAPI";
import { canAccessEmailAdmin } from "@/lib/admin-auth";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { isValidEmail } from "@/lib/email";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

function HealthDot({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="flex items-center gap-2.5 text-sm font-medium text-brand-950">
        <span
          className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`}
          aria-hidden
        />
        {label}
      </span>
      <StatusPill
        label={ok ? "Configured" : "Missing"}
        tone={ok ? "success" : "danger"}
      />
    </div>
  );
}

export default function AdminEmailPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-slate-500">Loading Email tools…</p>}
    >
      <AdminEmailPageInner />
    </Suspense>
  );
}

function AdminEmailPageInner() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim() || undefined;
  const authUser = useAppSelector((state) => state.auth.user);
  const allowed = canAccessEmailAdmin(authUser);

  const { data, isLoading, isError, error, refetch } = useGetEmailHealthQuery(
    undefined,
    { skip: !allowed },
  );
  const [sendTest, { isLoading: isSendingTest }] = useSendEmailTestMutation();

  const [to, setTo] = useState("");
  const [type, setType] = useState<EmailNotificationType>("ORDER_CONFIRMATION");

  const health = data?.data;

  async function onSendTest(event: FormEvent) {
    event.preventDefault();
    const email = to.trim();

    if (!isValidEmail(email)) {
      dispatch(toast.error("Enter a valid email address."));
      return;
    }

    try {
      const result = await sendTest({ to: email, type }).unwrap();
      const sent = result.data;
      dispatch(
        toast.success(
          sent
            ? `Test email sent via Resend to ${sent.to} (${sent.subject}). Inbox delivery is not guaranteed.`
            : result.message || "Test email sent via Resend.",
        ),
      );
    } catch (err) {
      dispatch(
        toast.error(
          getFetchErrorMessage(
            err as { status?: number | string; data?: unknown },
            "Email could not be sent.",
          ),
        ),
      );
    }
  }

  if (!allowed) {
    return (
      <>
        <AdminPageHeader
          title="Email"
          description="Order emails are managed on the server."
        />
        <AdminPanel title="Access denied">
          <p className="text-sm text-slate-600">
            Email tools are limited to ADMIN or MANAGER staff with the
            NOTIFICATIONS permission.
          </p>
        </AdminPanel>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Email"
        description="Check Resend configuration and send a sample order email. Real order emails are sent by the backend, not this page."
      />

      <div className="space-y-5">
        <AdminPanel
          title="Configuration"
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-brand-950 hover:bg-brand-50"
            >
              Refresh
            </button>
          }
        >
          {isLoading ? (
            <p className="text-sm text-slate-500">Checking server status…</p>
          ) : null}

          {isError ? (
            <p className="text-sm text-red-700">
              {getFetchErrorMessage(
                error as { status?: number | string; data?: unknown },
                "Could not load email health.",
              )}
            </p>
          ) : null}

          {health ? (
            <div className="space-y-3">
              <HealthDot label="Resend + from address" ok={health.configured} />
              <HealthDot label="From address" ok={health.fromConfigured} />
              <HealthDot label="Reply-to" ok={health.replyToConfigured} />
              <HealthDot
                label="Storefront URL"
                ok={health.frontendUrlConfigured}
              />
              {!health.configured ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Transactional email is not fully configured on the server.
                  Order emails will be skipped. Ask a backend admin to set
                  RESEND_API_KEY and EMAIL_FROM on the API host (Railway), not
                  in Next.js.
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Server credentials are present. Keys are never shown here.
                </p>
              )}
              {!health.frontendUrlConfigured ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  FRONTEND_URL is not set on the API. View Order links in emails
                  may point at the wrong site.
                </p>
              ) : null}
            </div>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Send test email">
          <p className="mb-4 text-sm text-slate-600">
            This sends a sample National Electronics order email. It does not
            attach to a real order. Until the sending domain is verified in
            Resend, test mail may only deliver to the account that owns the API
            key.
          </p>
          <form onSubmit={onSendTest} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-950">
                To
              </span>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-brand-900/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-950">
                Template
              </span>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as EmailNotificationType)
                }
                className="w-full rounded-xl border-2 border-brand-900/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:bg-white"
              >
                {EMAIL_NOTIFICATION_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={isSendingTest}
              className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isSendingTest ? "Sending…" : "Send test"}
            </button>
          </form>
        </AdminPanel>

        <EmailNotificationsPanel orderId={orderId} />
      </div>
    </>
  );
}
