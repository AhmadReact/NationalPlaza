import type { Metadata } from "next";
import {
  PolicyCard,
  PolicyNote,
  PolicyShell,
} from "@/components/policy-shell";

export const metadata: Metadata = {
  title: "Return & Refund Policy — National Electronics",
  description:
    "Exchange and return conditions for products purchased from National Electronics, including invoice, packing, and time-limit rules.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyShell
      title="Return & Refund Policy"
      intro="At National Electronics, customer satisfaction is our priority. We understand that sometimes a product may not meet your expectations, and we offer an exchange policy under the following conditions."
      contactPrompt="Need to start an exchange?"
    >
      <PolicyCard id="exchange-policy" number="01" title="Exchange Policy">
        <ul className="list-disc space-y-2 pl-5">
          <li>No cash refunds.</li>
          <li>An original invoice is required for product exchange.</li>
          <li>
            Products should be exchanged in the state they were sold, with
            complete original packing and the entire contents of the package.
          </li>
          <li>Used products will not be exchanged.</li>
          <li>Exchange is only possible within the same category.</li>
          <li>After 14 days, 15% of the amount will be deducted.</li>
          <li>
            In case of a size issue, customers may exchange their hob and hood
            without deduction for 2 months.
          </li>
          <li>No exchange is possible after 2 months.</li>
          <li>Items on promotion cannot be exchanged.</li>
          <li>
            Items purchased at the invoice price that later go on promotion will
            be exchanged at current prices.
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard id="how-to-start" number="02" title="How to Start an Exchange">
        <p>To begin your exchange request, please contact us by phone or visit our store:</p>
        <ul className="space-y-3">
          <li>
            <span className="font-bold text-brand-950">Phone / WhatsApp: </span>
            <a href="tel:+923344376840" className="text-brand-700 hover:underline">
              +92 334 4376840
            </a>
          </li>
          <li>
            <span className="font-bold text-brand-950">Visit: </span>
            National Electronics, Thana Bazar, Arifwala, Pakistan
          </li>
        </ul>
        <p>
          Once your request is approved, we will guide you with a return
          shipping label and instructions on where and how to send your product.
        </p>
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <strong className="font-semibold">Note:</strong> Items returned to us
          without prior communication will not be accepted.
        </p>
        <p>
          You can always contact us for any question at{" "}
          <a href="tel:+923344376840" className="font-semibold text-brand-700 hover:underline">
            +92 334 4376840
          </a>
          .
        </p>
      </PolicyCard>

      <PolicyNote />
    </PolicyShell>
  );
}
