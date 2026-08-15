"use client";

import Link from "next/link";
import { selectAuthUser } from "@/app/admin/login/store/authSlice";
import { AdminIcon } from "@/components/admin/icons";
import { visibleNavGroups } from "@/lib/admin-nav";
import { getUserDisplayName } from "@/app/admin/login/store/loginAPI";
import { useAppSelector } from "@/lib/store/hooks";

export function StaffHome() {
  const user = useAppSelector(selectAuthUser);
  const groups = visibleNavGroups(user).filter((group) =>
    group.items.some((item) => item.href !== "/admin"),
  );
  const name = getUserDisplayName(user);

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
        Welcome{name ? `, ${name}` : ""}
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Dashboard analytics need the Reports permission. Open a module you can
        access:
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {groups.flatMap((group) =>
          group.items
            .filter((item) => item.href !== "/admin")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-brand-950 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-800">
                  <AdminIcon name={item.icon} className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            )),
        )}
      </div>
    </section>
  );
}
