"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { selectCartItemCount } from "@/app/store/cartSlice";
import { useGetStoreCategoryTreeQuery } from "@/app/store/customerAPI";
import { useAppSelector } from "@/lib/store/hooks";

const fallbackNavLinks = [
  { label: "Air Conditioners", href: "/categories/air-conditioner" },
  { label: "Refrigerators", href: "/categories/refrigerator" },
  { label: "Air Coolers", href: "/categories/air-coolers" },
  { label: "LED TVs", href: "/categories/led-tv" },
];

const staticLinks = [
  { label: "All Categories", href: "/categories" },
  { label: "Why Us", href: "/#why-us" },
  { label: "Reviews", href: "/#reviews" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useAppSelector(selectCartItemCount);
  const { data: treeData } = useGetStoreCategoryTreeQuery();

  const navLinks = useMemo(() => {
    const roots = (treeData?.data ?? [])
      .filter((node) => node.isActive !== false)
      .slice(0, 5)
      .map((node) => ({
        label: node.name,
        href: `/categories/${node.slug}`,
      }));

    const categoryLinks = roots.length > 0 ? roots : fallbackNavLinks;
    return [...categoryLinks, ...staticLinks];
  }, [treeData?.data]);

  return (
    <header className="sticky top-0 z-50 shadow-lg shadow-brand-950/5">
      <div className="bg-brand-950 text-xs text-brand-100 sm:text-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <p className="flex items-center gap-2">
            <TruckIcon className="h-4 w-4 text-gold-400" />
            <span className="hidden sm:inline">Free shipping all over Pakistan</span>
            <span className="sm:hidden">Nationwide shipping</span>
          </p>
          <div className="flex items-center gap-4">
            <a href="tel:+923344376840" className="flex items-center gap-1.5 transition-colors hover:text-gold-300">
              <PhoneIcon className="h-3.5 w-3.5" />
              +92 334 4376840
            </a>
            <a href="mailto:info@nationalelectronics.pk" className="hidden items-center gap-1.5 transition-colors hover:text-gold-300 md:flex">
              <MailIcon className="h-3.5 w-3.5" />
              info@nationalelectronics.pk
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
          <button
            className="-ml-1 rounded-lg p-2 text-brand-950 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-800 to-brand-950 font-display text-lg font-extrabold text-gold-400 shadow-md">
              N
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-extrabold tracking-tight text-brand-950 sm:text-xl">
                National <span className="text-brand-600">Electronics</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600 sm:text-[11px]">
                Trusted since 1946
              </span>
            </span>
          </Link>

          <div className="hidden flex-1 items-center md:flex">
            <div className="flex w-full max-w-xl items-center overflow-hidden rounded-full border-2 border-brand-900/15 bg-slate-50 transition-colors focus-within:border-brand-600">
              <input
                type="search"
                placeholder="Search ACs, refrigerators, coolers, TVs…"
                className="w-full bg-transparent px-5 py-2.5 text-sm outline-none placeholder:text-slate-400"
              />
              <button className="m-1 flex items-center gap-2 rounded-full bg-brand-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                <SearchIcon className="h-4 w-4" />
                <span className="hidden lg:inline">Search</span>
              </button>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50 sm:inline"
            >
              Sign in
            </Link>
            <IconButton label="Wishlist">
              <HeartIcon className="h-5 w-5" />
            </IconButton>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative rounded-full p-2.5 text-brand-950 transition-colors hover:bg-brand-50"
            >
              <CartIcon className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 w-4.5 min-w-[18px] place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-brand-950">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <nav className={`bg-brand-900 text-sm text-brand-100 ${menuOpen ? "block" : "hidden"} lg:block`}>
        <div className="mx-auto max-w-7xl px-4">
          <ul className="flex flex-col lg:flex-row lg:items-center">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b-2 border-transparent px-4 py-3 font-medium transition-colors hover:bg-brand-800 hover:text-gold-300 lg:hover:border-gold-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="lg:ml-auto">
              <span className="hidden items-center gap-2 px-4 py-3 font-semibold text-gold-300 lg:flex">
                <SparkIcon className="h-4 w-4" />
                Summer Sale is Live
              </span>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

function IconButton({
  children,
  label,
  badge,
}: {
  children: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      aria-label={label}
      className="relative rounded-full p-2.5 text-brand-950 transition-colors hover:bg-brand-50"
    >
      {children}
      {badge !== undefined && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4.5 w-4.5 min-w-[18px] place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-brand-950">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

function svgProps(className?: string) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  } as const;
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M1 6h13v10H1zM14 9h4l4 4v3h-8z" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}
function MailIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.7" y2="16.7" />
    </svg>
  );
}
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
    </svg>
  );
}
function CartIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  );
}
function SparkIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M5 19l2.8-2.8M16.2 7.8 19 5" />
    </svg>
  );
}
