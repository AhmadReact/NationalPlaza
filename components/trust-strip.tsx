const features = [
  {
    title: "Delivery Across Punjab",
    text: "Paid shipping throughout Punjab. Charges confirmed at checkout",
    icon: (
      <path d="M1 8h15v12H1zM16 11h4l3 4v5h-7zM5.5 23a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18.5 23a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 4h10M6 1h10" />
    ),
  },
  {
    title: "7-Day Replacement",
    text: "No-questions-asked replacement guarantee",
    icon: (
      <path d="M12 3a9 9 0 1 0 9 9M21 3v6h-6M12 8v4l3 2" />
    ),
  },
  {
    title: "Dedicated Support",
    text: "Real humans on call & WhatsApp, 7 days a week",
    icon: (
      <path d="M3 12a9 9 0 0 1 18 0M3 12v5a2 2 0 0 0 2 2h2v-7H3zM21 12v5a2 2 0 0 1-2 2h-2v-7h4zM17 19v1a2 2 0 0 1-2 2h-3" />
    ),
  },
  {
    title: "Secure Payments",
    text: "Cash on delivery, cards & bank transfer",
    icon: (
      <path d="M12 2 4 5v6c0 5 3.4 8.8 8 11 4.6-2.2 8-6 8-11V5zM8.5 12l2.5 2.5 4.5-4.5" />
    ),
  },
];

export function TrustStrip() {
  return (
    <section id="why-us" className="scroll-mt-32 border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                {feature.icon}
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-bold text-brand-950">{feature.title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {feature.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
