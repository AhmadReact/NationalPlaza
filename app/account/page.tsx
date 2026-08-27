"use client";

import Link from "next/link";
import {
  unwrapAccountProducts,
  useGetAddressesQuery,
  useGetPreferencesQuery,
  useGetRecentlyViewedQuery,
  useGetWishlistQuery,
} from "@/app/store/accountAPI";
import { selectCartItemCount } from "@/app/store/cartSlice";
import {
  getCustomerDisplayName,
} from "@/app/store/customerAuthAPI";
import { selectCustomerUser } from "@/app/store/customerAuthSlice";
import { useAppSelector } from "@/lib/store/hooks";

const cards = [
  {
    href: "/account/addresses",
    title: "Addresses",
    description: "Shipping addresses for checkout",
  },
  {
    href: "/account/wishlist",
    title: "Wishlist",
    description: "Products you saved for later",
  },
  {
    href: "/account/recently-viewed",
    title: "Recently viewed",
    description: "Pick up where you left off",
  },
  {
    href: "/account/preferences",
    title: "Preferences",
    description: "Notifications, language, and currency",
  },
  {
    href: "/cart",
    title: "Cart",
    description: "Items ready for checkout",
  },
] as const;

export default function AccountPage() {
  const user = useAppSelector(selectCustomerUser);
  const cartCount = useAppSelector(selectCartItemCount);
  const { data: addressesData } = useGetAddressesQuery();
  const { data: wishlistData } = useGetWishlistQuery();
  const { data: recentData } = useGetRecentlyViewedQuery();
  const { data: preferencesData } = useGetPreferencesQuery();

  const counts: Record<string, string> = {
    Addresses: `${addressesData?.data?.length ?? 0} saved`,
    Wishlist: `${unwrapAccountProducts(wishlistData?.data).length} items`,
    "Recently viewed": `${unwrapAccountProducts(recentData?.data).length} products`,
    Preferences: preferencesData?.data?.emailNotifications
      ? "Email on"
      : "Email off",
    Cart: `${cartCount} item${cartCount === 1 ? "" : "s"}`,
  };

  return (
    <div>
      <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-brand-400" />
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-950">
        Welcome back, {getCustomerDisplayName(user).split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{user?.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-200 hover:shadow-md"
          >
            <p className="font-display text-lg font-extrabold text-brand-950">
              {card.title}
            </p>
            <p className="mt-1 text-sm text-slate-500">{card.description}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-brand-700">
              {counts[card.title]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
