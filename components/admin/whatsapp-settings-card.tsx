"use client";

import Link from "next/link";
import { canAccessWhatsAppAdmin } from "@/lib/admin-auth";
import { useAppSelector } from "@/lib/store/hooks";

export function WhatsAppSettingsCard() {
  const authUser = useAppSelector((state) => state.auth.user);
  if (!canAccessWhatsAppAdmin(authUser)) return null;

  return (
    <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-4">
      <p className="text-sm font-semibold text-brand-950">WhatsApp</p>
      <p className="mt-1 text-sm text-brand-900">
        Check Cloud API configuration and send a session test. Order messages
        are sent by the backend.
      </p>
      <Link
        href="/admin/whatsapp"
        className="mt-3 inline-flex text-sm font-semibold text-brand-800 hover:underline"
      >
        Open WhatsApp tools
      </Link>
    </div>
  );
}
