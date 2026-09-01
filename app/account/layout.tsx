import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "My Account",
  description:
    "Manage your addresses, wishlist, recently viewed products, preferences, and cart.",
  robots: noIndexRobots,
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountShell>{children}</AccountShell>;
}
