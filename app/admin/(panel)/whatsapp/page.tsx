"use client";

import { type FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AdminPageHeader,
  AdminPanel,
  StatusPill,
} from "@/components/admin/ui";
import { WhatsAppNotificationsPanel } from "@/app/admin/(panel)/whatsapp/notifications-panel";
import {
  DEFAULT_WHATSAPP_TEST_MESSAGE,
  useGetWhatsAppHealthQuery,
  useSendWhatsAppTestMutation,
} from "@/app/admin/(panel)/whatsapp/store/whatsappAPI";
import { canAccessWhatsAppAdmin } from "@/lib/admin-auth";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { isValidCheckoutPhone } from "@/lib/phone";
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

export default function AdminWhatsAppPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-slate-500">Loading WhatsApp tools…</p>
      }
    >
      <AdminWhatsAppPageInner />
    </Suspense>
  );
}

function AdminWhatsAppPageInner() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim() || undefined;
  const authUser = useAppSelector((state) => state.auth.user);
  const allowed = canAccessWhatsAppAdmin(authUser);

  const { data, isLoading, isError, error, refetch } = useGetWhatsAppHealthQuery(
    undefined,
    { skip: !allowed },
  );
  const [sendTest, { isLoading: isSendingTest }] = useSendWhatsAppTestMutation();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState(DEFAULT_WHATSAPP_TEST_MESSAGE);

  const health = data?.data;
  const fullyConfigured = Boolean(
    health?.configured &&
      health.phoneNumberIdConfigured &&
      health.businessAccountIdConfigured,
  );

  async function onSendTest(event: FormEvent) {
    event.preventDefault();
    const phone = phoneNumber.trim();
    const text = message.trim() || DEFAULT_WHATSAPP_TEST_MESSAGE;

    if (!isValidCheckoutPhone(phone) || phone.length > 20) {
      dispatch(
        toast.error(
          "Enter a valid phone number (03XXXXXXXXX, +92…, or 92…), max 20 characters.",
        ),
      );
      return;
    }
    if (text.length > 1024) {
      dispatch(toast.error("Message must be 1024 characters or fewer."));
      return;
    }

    try {
      const result = await sendTest({
        phoneNumber: phone,
        message: text,
      }).unwrap();
      dispatch(
        toast.success(result.message || "Test message sent."),
      );
    } catch (err) {
      dispatch(
        toast.error(
          getFetchErrorMessage(
            err as { status?: number | string; data?: unknown },
            "WhatsApp message could not be sent.",
          ),
        ),
      );
    }
  }

  if (!allowed) {
    return (
      <>
        <AdminPageHeader
          title="WhatsApp"
          description="Order notifications are managed on the server."
        />
        <AdminPanel title="Access denied">
          <p className="text-sm text-slate-600">
            WhatsApp tools are limited to ADMIN or MANAGER staff with the
            NOTIFICATIONS permission.
          </p>
        </AdminPanel>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="WhatsApp"
        description="Check Cloud API configuration and send a session test. Order alerts are sent by the backend, not this page."
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
                "Could not load WhatsApp health.",
              )}
            </p>
          ) : null}

          {health ? (
            <div className="space-y-3">
              <HealthDot label="Access token" ok={health.configured} />
              <HealthDot
                label="Phone number ID"
                ok={health.phoneNumberIdConfigured}
              />
              <HealthDot
                label="Business account ID"
                ok={health.businessAccountIdConfigured}
              />
              {!fullyConfigured ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  WhatsApp is not fully configured on the server. Order WhatsApp
                  messages will be skipped. Ask a backend admin to set
                  environment variables.
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Server credentials are present. Tokens are never shown here.
                </p>
              )}
            </div>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Send test message">
          <p className="mb-4 text-sm text-slate-600">
            This is a session text test. It may fail unless the number is in
            Meta’s test list or has messaged the business recently. Real order
            alerts use templates, not this endpoint.
          </p>
          <form onSubmit={onSendTest} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-950">
                Phone number
              </span>
              <input
                type="tel"
                required
                maxLength={20}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="923344376840"
                className="w-full rounded-xl border-2 border-brand-900/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-950">
                Message
              </span>
              <textarea
                required
                maxLength={1024}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border-2 border-brand-900/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:bg-white"
              />
              <span className="mt-1 block text-xs text-slate-400">
                {message.length}/1024
              </span>
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

        <WhatsAppNotificationsPanel orderId={orderId} />
      </div>
    </>
  );
}
