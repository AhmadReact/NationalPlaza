"use client";

import { useState } from "react";

const whyChooseUs = [
  { title: "100% Authentic Electronics", text: "We offer only genuine, top-brand products sourced directly from authorized distributors." },
  { title: "Fast & Reliable Delivery", text: "Get your order swiftly and securely, delivered across Punjab. Shipping charges apply." },
  { title: "Customer-First Approach", text: "Your satisfaction is our top priority — before and after the sale." },
  { title: "80 Years of Trust", text: "Serving Pakistani families since 1946 with honest prices and honest advice." },
  { title: "Guaranteed Quality & Originality", text: "Every purchase comes with official warranty and complete peace of mind." },
];

export function DetailTabs({
  intro,
  specs,
}: {
  intro: string[];
  specs: [string, string][];
}) {
  const tabs = ["Description", "Specifications", "Why Choose Us"];
  const [active, setActive] = useState(0);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 bg-slate-50/60">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={`relative shrink-0 px-6 py-4 text-sm font-bold transition-colors ${
              i === active
                ? "text-brand-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
            {i === active && (
              <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-brand-600 to-gold-500" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8">
        {active === 0 && (
          <div className="max-w-3xl space-y-4">
            {intro.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-sm leading-relaxed text-slate-600">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {active === 1 &&
          (specs.length > 0 ? (
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {specs.map(([label, value], index) => (
                <div
                  key={`${label}-${index}`}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 py-3.5"
                >
                  <dt className="text-sm font-semibold text-slate-500">{label}</dt>
                  <dd className="text-sm font-bold text-brand-950 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">No specifications available for this product.</p>
          ))}

        {active === 2 && (
          <ul className="grid gap-5 sm:grid-cols-2">
            {whyChooseUs.map((item) => (
              <li key={item.title} className="flex items-start gap-4 rounded-2xl bg-slate-50 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-900 text-gold-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M12 2 4 5v6c0 5 3.4 8.8 8 11 4.6-2.2 8-6 8-11V5zM8.5 12l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-brand-950">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
