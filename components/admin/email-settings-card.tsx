"use client";

import Link from "next/link";
import { canAccessEmailAdmin } from "@/lib/admin-auth";
import { useAppSelector } from "@/lib/store/hooks";

export function EmailSettingsCard() {
  const authUser = useAppSelector((state) => state.auth.user);
  if (!canAccessEmailAdmin(authUser)) return null;

  return (
    <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-4">
      <p className="text-sm font-semibold text-brand-950">Email</p>
      <p className="mt-1 text-sm text-brand-900">
        Check Resend configuration and send a sample order email. Order messages
        are sent by the backend.
      </p>
      <Link
        href="/admin/email"
        className="mt-3 inline-flex text-sm font-semibold text-brand-800 hover:underline"
      >
        Open Email tools
      </Link>
    </div>
  );
}
