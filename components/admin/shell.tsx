"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/admin/actions";
import { logout, selectAuthUser } from "@/app/admin/login/store/authSlice";
import { getUserDisplayName } from "@/app/admin/login/store/loginAPI";
import { visibleNavGroups } from "@/lib/admin-nav";
import { AdminIcon } from "@/components/admin/icons";
import { AdminPermissionGate } from "@/components/admin/permission-gate";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector(selectAuthUser);
  const displayName = authUser ? getUserDisplayName(authUser) : adminName;
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    dispatch(logout());
    await logoutAdmin();
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const groups = visibleNavGroups(authUser);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {groups.map((group) => (
        <div key={group.id} className="mb-1">
          {group.label ? (
            <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-400/70">
              {group.label}
            </p>
          ) : (
            <div className="mt-2 border-t border-white/10 pt-2" />
          )}
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-800 text-gold-300 shadow-sm"
                    : "text-brand-100/80 hover:bg-brand-800/60 hover:text-white"
                }`}
              >
                <AdminIcon name={item.icon} className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-[#f7f8fb]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col self-start overflow-y-auto bg-brand-950 text-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 font-display text-lg font-extrabold text-gold-400">
            N
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-extrabold tracking-tight">
              National Electronics
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-400">
              Admin
            </p>
          </div>
        </div>
        {nav}
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-100/70 transition-colors hover:bg-brand-800 hover:text-white"
          >
            <AdminIcon name="logout" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-brand-950/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-brand-950 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-800 font-display font-extrabold text-gold-400">
                  N
                </span>
                <span className="font-display text-sm font-bold">Admin</span>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-brand-800"
              >
                <AdminIcon name="close" className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <div className="border-t border-white/10 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-100/70 hover:bg-brand-800 hover:text-white"
              >
                <AdminIcon name="logout" className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-brand-950 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <AdminIcon name="menu" className="h-5 w-5" />
          </button>

          <div className="hidden flex-1 items-center sm:flex">
            <div className="flex w-full max-w-md items-center overflow-hidden rounded-full border-2 border-brand-900/10 bg-slate-50 focus-within:border-brand-600">
              <AdminIcon name="search" className="ml-3.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search admin…"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full p-2 text-brand-950 hover:bg-brand-50"
            >
              <AdminIcon name="bell" className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold-500" />
            </button>
            <div className="flex items-center gap-2 rounded-full bg-brand-50 py-1 pl-1 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-900 text-xs font-bold text-gold-400">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-sm font-semibold text-brand-950 sm:inline">
                {displayName}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <AdminPermissionGate>{children}</AdminPermissionGate>
        </main>
      </div>
    </div>
  );
}
