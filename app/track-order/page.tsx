import type { Metadata } from "next";
import TrackOrderClient from "./track-order-client";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Look up a guest order with your order number and checkout email. No account required.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
