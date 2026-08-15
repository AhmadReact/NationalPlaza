import Link from "next/link";
import { permissionLabel, type Permission } from "@/lib/rbac";

export function AdminForbidden({ permission }: { permission?: Permission }) {
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
        403
      </p>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-brand-950">
        You don’t have access to this module
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {permission
          ? `This page needs the ${permissionLabel(permission)} permission.`
          : "Your role does not include this area of the admin panel."}
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Back to admin
      </Link>
    </section>
  );
}
