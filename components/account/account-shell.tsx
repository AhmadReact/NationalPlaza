"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { selectCustomerIsAuthenticated } from "@/app/store/customerAuthSlice";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { useAppSelector } from "@/lib/store/hooks";

const navItems = [
  { href: "/account", label: "Overview" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/recently-viewed", label: "Recently viewed" },
  { href: "/account/preferences", label: "Preferences" },
  { href: "/cart", label: "Cart" },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectCustomerIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/account")}`);
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-slate-500">
            Redirecting to sign in…
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:py-14 lg:grid-cols-[220px_1fr]">
          <aside>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              My account
            </p>
            <nav className="mt-4 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const active =
                    item.href === "/account"
                      ? pathname === "/account"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                          active
                            ? "bg-brand-900 text-white"
                            : "text-brand-950 hover:bg-brand-50"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
          <div>{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
