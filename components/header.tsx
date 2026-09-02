"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { CategoryTreeNode } from "@/app/admin/(panel)/categories/store/categoryAPI";
import {
  accountApi,
  unwrapAccountProducts,
  useGetWishlistQuery,
} from "@/app/store/accountAPI";
import { cartApi } from "@/app/store/cartAPI";
import { clearCartState, selectCartItemCount } from "@/app/store/cartSlice";
import { getCustomerDisplayName } from "@/app/store/customerAuthAPI";
import {
  customerLogout,
  selectCustomerIsAuthenticated,
  selectCustomerUser,
} from "@/app/store/customerAuthSlice";
import {
  getArtKindForSlug,
  useGetStoreCategoryTreeQuery,
} from "@/app/store/customerAPI";
import { ApplianceArt } from "@/components/appliance-art";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

const fallbackNavLinks = [
  { label: "Air Conditioners", href: "/categories/air-conditioner" },
  { label: "Refrigerators", href: "/categories/refrigerator" },
  { label: "Air Coolers", href: "/categories/air-coolers" },
  { label: "LED TVs", href: "/categories/led-tv" },
];

const staticLinks = [
  { label: "Why Us", href: "/#why-us" },
  { label: "Reviews", href: "/#reviews" },
];

function hasFineHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(selectCartItemCount);
  const isAuthenticated = useAppSelector(selectCustomerIsAuthenticated);
  const customerUser = useAppSelector(selectCustomerUser);
  const { data: treeData } = useGetStoreCategoryTreeQuery();
  const { data: wishlistData } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated,
  });
  const wishlistCount = unwrapAccountProducts(wishlistData?.data).length;

  function handleLogout() {
    setMenuOpen(false);
    dispatch(customerLogout());
    dispatch(clearCartState());
    dispatch(accountApi.util.resetApiState());
    dispatch(cartApi.util.resetApiState());
    window.location.assign("/");
  }

  const categories = useMemo(
    () => (treeData?.data ?? []).filter((node) => node.isActive !== false),
    [treeData?.data],
  );

  const featuredLinks = useMemo(() => {
    const roots = categories.slice(0, 5).map((node) => ({
      label: node.name,
      href: `/categories/${node.slug}`,
    }));
    return roots.length > 0 ? roots : fallbackNavLinks;
  }, [categories]);

  useEffect(() => {
    if (!menuOpen) return;

    function syncBodyScroll() {
      document.body.style.overflow = window.matchMedia("(min-width: 1024px)")
        .matches
        ? ""
        : "hidden";
    }

    syncBodyScroll();
    const media = window.matchMedia("(min-width: 1024px)");
    media.addEventListener("change", syncBodyScroll);
    return () => {
      media.removeEventListener("change", syncBodyScroll);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 flex max-h-dvh flex-col overflow-hidden shadow-lg shadow-brand-950/5 lg:max-h-none lg:overflow-visible">
      <div className="shrink-0 bg-brand-950 text-xs text-brand-100 sm:text-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <p className="flex items-center gap-2">
            <TruckIcon className="h-4 w-4 text-gold-400" />
            <span className="hidden sm:inline">Delivery across Punjab · charges apply</span>
            <span className="sm:hidden">Punjab delivery</span>
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

      <div className="shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
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
            <HeaderSearch />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  className="hidden max-w-36 truncate rounded-full px-3 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50 sm:inline"
                >
                  {getCustomerDisplayName(customerUser)}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login?next=/account"
                className="hidden rounded-full px-3 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50 sm:inline"
              >
                Sign in
              </Link>
            )}
            <Link
              href={
                isAuthenticated
                  ? "/account/wishlist"
                  : "/login?next=/account/wishlist"
              }
              aria-label="Wishlist"
              className="relative rounded-full p-2.5 text-brand-950 transition-colors hover:bg-brand-50"
            >
              <HeartIcon className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 w-4.5 min-w-[18px] place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-brand-950">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
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
        <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden">
          <HeaderSearch />
        </div>
      </div>

      <nav
        className={`relative bg-brand-900 text-sm text-brand-100 ${
          menuOpen
            ? "block min-h-0 flex-1 overflow-y-auto overscroll-contain"
            : "hidden"
        } lg:block lg:flex-none lg:overflow-visible`}
      >
        <div className="mx-auto max-w-7xl px-4">
          <ul className="flex flex-col lg:flex-row lg:items-center">
            {featuredLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b-2 border-transparent px-4 py-3 font-medium transition-colors hover:bg-brand-800 hover:text-gold-300 focus-visible:bg-brand-800 focus-visible:text-gold-300 lg:hover:border-gold-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <AllCategoriesNavItem categories={categories} />
            {staticLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b-2 border-transparent px-4 py-3 font-medium transition-colors hover:bg-brand-800 hover:text-gold-300 focus-visible:bg-brand-800 focus-visible:text-gold-300 lg:hover:border-gold-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="lg:hidden">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block border-b-2 border-transparent px-4 py-3 font-medium transition-colors hover:bg-brand-800 hover:text-gold-300"
                  >
                    My account
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full border-b-2 border-transparent px-4 py-3 text-left font-medium transition-colors hover:bg-brand-800 hover:text-gold-300"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  href="/login?next=/account"
                  onClick={() => setMenuOpen(false)}
                  className="block border-b-2 border-transparent px-4 py-3 font-medium transition-colors hover:bg-brand-800 hover:text-gold-300"
                >
                  Sign in
                </Link>
              )}
            </li>
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

function AllCategoriesNavItem({
  categories,
}: {
  categories: CategoryTreeNode[];
}) {
  const [open, setOpen] = useState(false);
  const itemRef = useRef<HTMLLIElement>(null);
  const menuId = "all-categories-menu";
  const items =
    categories.length > 0
      ? categories
      : fallbackNavLinks.map((link) => ({
          id: link.href,
          name: link.label,
          slug: link.href.replace("/categories/", ""),
          description: null,
          image: null,
          isActive: true,
          sortOrder: 0,
          showOnHome: true,
          homeSortOrder: 0,
          children: [] as CategoryTreeNode[],
        }));

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!itemRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function handleMouseEnter() {
    if (hasFineHover()) setOpen(true);
  }

  function handleMouseLeave() {
    if (!hasFineHover()) return;
    if (itemRef.current?.contains(document.activeElement)) return;
    setOpen(false);
  }

  function handleClick() {
    if (hasFineHover()) {
      setOpen(true);
      return;
    }
    setOpen((value) => !value);
  }

  function handleBlur(event: React.FocusEvent<HTMLLIElement>) {
    const next = event.relatedTarget as Node | null;
    if (!next) return;
    if (!itemRef.current?.contains(next)) setOpen(false);
  }

  return (
    <li
      ref={itemRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={handleClick}
        className={`flex w-full items-center justify-between gap-1.5 border-b-2 px-4 py-3 font-medium transition-colors hover:bg-brand-800 hover:text-gold-300 focus-visible:bg-brand-800 focus-visible:text-gold-300 lg:w-auto lg:justify-center lg:hover:border-gold-400 ${
          open
            ? "border-gold-400 bg-brand-800 text-gold-300"
            : "border-transparent"
        }`}
      >
        All Categories
        <ChevronIcon
          className={`h-3.5 w-3.5 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={menuId}
        role="region"
        aria-label="All categories"
        hidden={!open}
        className={
          open
            ? "bg-brand-950 lg:absolute lg:inset-x-0 lg:top-full lg:z-50 lg:border-t lg:border-gold-400/80 lg:bg-white lg:shadow-xl lg:shadow-brand-950/20"
            : "hidden"
        }
      >
        <ul className="flex flex-col lg:mx-auto lg:grid lg:max-h-[min(70vh,28rem)] lg:max-w-7xl lg:grid-cols-3 lg:gap-2 lg:overflow-y-auto lg:px-4 lg:py-5 xl:grid-cols-4">
          {items.map((category) => {
            const children = (category.children ?? []).filter(
              (child) => child.isActive !== false,
            );
            return (
              <li key={category.id}>
                <div className="lg:rounded-xl lg:p-1.5 lg:transition-colors lg:hover:bg-brand-50">
                  <Link
                    href={`/categories/${category.slug}`}
                    className="flex items-center gap-3 px-8 py-2.5 text-sm font-medium text-brand-100 transition-colors hover:bg-brand-800 hover:text-gold-300 focus-visible:bg-brand-800 focus-visible:text-gold-300 lg:rounded-lg lg:px-2 lg:py-1.5 lg:text-brand-950 lg:hover:bg-transparent lg:hover:text-brand-950 lg:focus-visible:bg-transparent lg:focus-visible:text-brand-950 lg:focus-visible:outline-2 lg:focus-visible:outline-offset-2 lg:focus-visible:outline-brand-700"
                  >
                    <span className="hidden size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-linear-to-br from-brand-50 to-slate-100 text-brand-800 lg:grid">
                      {category.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={category.image}
                          alt=""
                          className="size-7 object-contain"
                        />
                      ) : (
                        <ApplianceArt
                          kind={getArtKindForSlug(category.slug)}
                          className="size-7"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate lg:font-semibold">
                        {category.name}
                      </span>
                      <span className="hidden text-[11px] text-slate-400 lg:block" aria-hidden="true">
                        View collection
                      </span>
                    </span>
                  </Link>
                  {children.length > 0 ? (
                    <ul className="lg:mt-0.5 lg:flex lg:flex-col lg:pl-13">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/categories/${child.slug}`}
                            className="block px-12 py-2 text-sm text-brand-200/80 transition-colors hover:bg-brand-800 hover:text-gold-300 focus-visible:bg-brand-800 focus-visible:text-gold-300 lg:truncate lg:py-0.5 lg:pl-0 lg:text-xs lg:text-slate-500 lg:hover:bg-transparent lg:hover:text-brand-800 lg:focus-visible:bg-transparent lg:focus-visible:text-brand-800"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}

function HeaderSearch() {
  return (
    <Suspense fallback={<SearchFormMarkup />}>
      <SearchForm />
    </Suspense>
  );
}

function SearchForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultQuery =
    pathname === "/search" ? searchParams.get("q")?.trim() ?? "" : "";

  return <SearchFormMarkup defaultQuery={defaultQuery} />;
}

function SearchFormMarkup({ defaultQuery = "" }: { defaultQuery?: string }) {
  return (
    <Form
      action="/search"
      className="flex w-full max-w-xl items-center overflow-hidden rounded-full border-2 border-brand-900/15 bg-slate-50 transition-colors focus-within:border-brand-600"
    >
      <input
        key={defaultQuery}
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder="Search ACs, refrigerators, coolers, TVs…"
        aria-label="Search products"
        enterKeyHint="search"
        className="w-full bg-transparent px-5 py-2.5 text-sm outline-none placeholder:text-slate-400"
      />
      <button
        type="submit"
        aria-label="Search"
        className="m-1 flex items-center gap-2 rounded-full bg-brand-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden lg:inline">Search</span>
      </button>
    </Form>
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
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
