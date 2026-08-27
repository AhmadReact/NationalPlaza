import Link from "next/link";
import { FooterPopularCategories } from "@/components/footer-popular-categories";

const columns = [
  {
    heading: "Policy",
    links: [
      { label: "Privacy Policy", href: "/policies/privacy-policy" },
      { label: "Terms & Conditions", href: "/policies/terms-of-service" },
      { label: "Return & Refund", href: "/policies/refund-policy" },
    ],
  },
  {
    heading: "Customer Support",
    links: [
      { label: "My Account", href: "/account" },
      { label: "Wishlist", href: "/account/wishlist" },
      { label: "Track Order", href: "/track-order" },
      { label: "FAQs", href: "#" },
      { label: "Customer Feedback", href: "#" },
      { label: "Reviews", href: "/#reviews" },
      { label: "Corporate Solutions", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      {/* newsletter */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-10 lg:flex-row lg:justify-between">
          <div className="text-center lg:text-left">
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
              Get exclusive deals before anyone else
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Join 50,000+ subscribers — sale alerts, new arrivals & seasonal offers.
            </p>
          </div>
          <form className="flex w-full max-w-md overflow-hidden rounded-full border border-white/15 bg-white/5 backdrop-blur focus-within:border-gold-400/60 transition-colors">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="w-full bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              className="m-1 shrink-0 rounded-full bg-gold-400 px-6 py-2 text-sm font-bold text-brand-950 hover:bg-gold-300 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* main columns */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 font-display text-lg font-extrabold text-gold-400">
              N
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-extrabold text-white">
                National Electronics
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-500">
                Trusted since 1946
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            National Electronics is one of the oldest and most trusted home
            appliances &amp; electronics stores in Pakistan, serving families
            since 1946 with genuine branded products at the lowest prices,
            reliable after-sales service and nationwide delivery.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-white/70">
            <li>
              <span className="font-semibold text-white/90">Address:</span>{" "}
              Thana Bazar, Arifwala, Pakistan
            </li>
            <li>
              <span className="font-semibold text-white/90">Phone:</span>{" "}
              <a href="tel:+923344376840" className="hover:text-gold-300 transition-colors">
                +92 334 4376840
              </a>
            </li>
            <li>
              <span className="font-semibold text-white/90">Email:</span>{" "}
              <a
                href="mailto:info@nationalelectronics.pk"
                className="hover:text-gold-300 transition-colors"
              >
                info@nationalelectronics.pk
              </a>
            </li>
          </ul>
        </div>

          <FooterPopularCategories />
          {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gold-400">
              {column.heading}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-gold-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} National Electronics. All rights
            reserved. Serving Pakistan since 1946.
          </p>
          <p>Cash on Delivery · Visa · Mastercard · Bank Transfer</p>
        </div>
      </div>
    </footer>
  );
}
