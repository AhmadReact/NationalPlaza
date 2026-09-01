import type { Metadata } from "next";
import {
  PolicyCard,
  PolicyNote,
  PolicyShell,
} from "@/components/policy-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms of service for shopping with National Electronics online or in store, including orders, delivery, warranty, and payment security.",
  alternates: { canonical: "/policies/terms-of-service" },
};

export default function TermsOfServicePage() {
  return (
    <PolicyShell
      title="Terms & Conditions"
      intro="Welcome to National Electronics, your trusted destination for high-quality household appliances. We offer a wide range of reliable home appliances including LED TVs, refrigerators, air conditioners, washing machines, kitchen hoods, hobs, microwaves, and more — all from trusted brands."
      contactPrompt="Questions about these terms?"
    >
      <PolicyCard id="acceptance" number="01" title="Acceptance of Terms">
        <p>
          You accept these terms and conditions by using our website or mobile
          app, or by purchasing at our offline store. Do not use our services if
          you disagree with these terms and conditions.
        </p>
      </PolicyCard>

      <PolicyCard id="products-pricing" number="02" title="Products and Pricing">
        <p>
          We sell a variety of home appliances. Prices and product details may
          change without notification. We take reasonable steps to guarantee
          that the product information is accurate.
        </p>
        <p>Prices displayed include applicable taxes unless otherwise stated.</p>
      </PolicyCard>

      <PolicyCard id="orders-payment" number="03" title="Orders and Payment">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            You agree to pay the claimed price, relevant taxes, and shipping
            costs by placing an order.
          </li>
          <li>
            Cash, credit/debit cards, and internet payment methods are
            acceptable.
          </li>
          <li>
            Orders are dependent on availability. We may cancel or reject any
            order at any time and for any reason.
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard id="shipping" number="04" title="Shipping and Delivery">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            We will deliver the product to your provided address within the
            specified period. Unexpected circumstances can cause delays.
          </li>
          <li>
            Shipping charges and estimated delivery times will be provided
            during checkout.
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard id="warranty" number="05" title="Warranty and Repairs">
        <p>
          A manufacturer&apos;s warranty may be included with certain products.
          Please review the warranty details included with the item.
        </p>
        <p>
          Please contact our customer service department for help with warranty
          claims or repairs.
        </p>
      </PolicyCard>

      <PolicyCard id="payment-security" number="06" title="Payment Gateway Security">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            We use secure third-party payment gateways for all online
            transactions.
          </li>
          <li>
            Your payment data is encrypted and processed securely — we do not
            store full card details on our servers.
          </li>
          <li>
            Our payment partners follow PCI-DSS standards to protect your
            financial information.
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard id="intellectual-property" number="07" title="Intellectual Property">
        <p>
          All text, graphics, and logos on our website and mobile app are the
          sole property of National Electronics and are covered by copyright and
          trademark laws.
        </p>
      </PolicyCard>

      <PolicyCard id="contact-information" number="08" title="Contact Information">
        <p>For inquiries, support, or complaints:</p>
        <ul className="space-y-3">
          <li>
            <span className="font-bold text-brand-950">Phone / WhatsApp: </span>
            <a href="tel:+923344376840" className="text-brand-700 hover:underline">
              +92 334 4376840
            </a>
          </li>
          <li>
            <span className="font-bold text-brand-950">Email: </span>
            <a
              href="mailto:info@nationalelectronics.pk"
              className="text-brand-700 hover:underline"
            >
              info@nationalelectronics.pk
            </a>
          </li>
          <li>
            <span className="font-bold text-brand-950">Store: </span>
            Thana Bazar, Arifwala, Pakistan
          </li>
        </ul>
      </PolicyCard>

      <PolicyNote />
    </PolicyShell>
  );
}
