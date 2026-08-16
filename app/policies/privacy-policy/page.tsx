import type { Metadata } from "next";
import {
  PolicyCard,
  PolicyNote,
  PolicyShell,
} from "@/components/policy-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — National Electronics",
  description:
    "How National Electronics collects, uses, shares, and protects your information when you visit our website or shop with us in store.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyShell
      title="Privacy Policy"
      intro="At National Electronics, we respect your right to privacy and are dedicated to keeping it private. When visiting our website, mobile applications, or physical store, we want you to understand how we collect, use, share, and secure your information."
      contactPrompt="Questions about privacy?"
    >
      <PolicyCard id="information-we-collect" number="01" title="Information We Collect">
        <p>
          National Electronics collects the following types of information when
          you visit our website, mobile applications, or physical store:
        </p>
        <ul className="space-y-4">
          <li>
            <p className="font-bold text-brand-950">Personal information</p>
            <p className="mt-1">
              Your name, contact details (email address, phone number, and
              mailing address), and payment information when you place an order.
            </p>
          </li>
          <li>
            <p className="font-bold text-brand-950">Transactional information</p>
            <p className="mt-1">
              Your purchases, order history, delivery details, and payment
              records.
            </p>
          </li>
          <li>
            <p className="font-bold text-brand-950">Device and usage information</p>
            <p className="mt-1">
              Information about your device (IP address, browser type, and
              operating system) and how you use our website.
            </p>
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard id="how-we-use" number="02" title="How We Use Your Information">
        <p>National Electronics uses your information for the following purposes:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>To process and fulfil your orders and provide customer support.</li>
          <li>
            To send you order updates, promotional offers, and newsletters with
            your consent.
          </li>
          <li>To improve our products, services, and user experience.</li>
          <li>
            To protect our rights, property, and safety, and to comply with legal
            obligations.
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard id="sharing" number="03" title="Sharing Your Information">
        <p>We may share your information with:</p>
        <ul className="space-y-4">
          <li>
            <p className="font-bold text-brand-950">Service providers</p>
            <p className="mt-1">
              Third-party companies that help us process payments, ship orders,
              and perform other business functions.
            </p>
          </li>
          <li>
            <p className="font-bold text-brand-950">Legal requirements</p>
            <p className="mt-1">
              To comply with applicable laws, regulations, or government
              requests.
            </p>
          </li>
          <li>
            <p className="font-bold text-brand-950">Business transfers</p>
            <p className="mt-1">
              In the event of a merger, sale, or transfer of our assets, your
              information may be transferred to the acquiring entity.
            </p>
          </li>
          <li>
            <p className="font-bold text-brand-950">With your consent</p>
            <p className="mt-1">
              We may share your information for other purposes if you consent.
            </p>
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard id="security" number="04" title="Security">
        <p>
          We take reasonable measures to protect your information from
          unauthorized access, disclosure, alteration, or destruction.
        </p>
      </PolicyCard>

      <PolicyCard id="payment-security" title="Payment Gateway Security and Processing">
        <p>
          We use secure third-party payment gateways to process your
          transactions. When you make a purchase on our website, your payment
          information (such as credit or debit card details) is securely
          transmitted to and processed by our payment gateway providers.
        </p>
        <p>
          <strong className="font-semibold text-brand-950">
            We do not store your complete card details on our servers.
          </strong>{" "}
          All payment transactions are encrypted using industry-standard SSL
          (Secure Socket Layer) technology to ensure the highest level of
          protection.
        </p>
        <p>
          Our payment partners comply with{" "}
          <strong className="font-semibold text-brand-950">
            PCI-DSS (Payment Card Industry Data Security Standard)
          </strong>{" "}
          requirements to ensure your payment data remains safe and secure. You
          may also pay by cash on delivery or bank transfer.
        </p>
      </PolicyCard>

      <PolicyNote />
    </PolicyShell>
  );
}
