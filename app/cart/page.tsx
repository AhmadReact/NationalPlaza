import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your cart and proceed to checkout.",
  robots: noIndexRobots,
};

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        <CartView />
      </main>
      <Footer />
    </>
  );
}
