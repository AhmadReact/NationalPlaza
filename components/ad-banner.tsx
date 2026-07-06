const featured = [
  {
    label: "Homage Air Conditioners",
    tagline: "Cool comfort, every summer",
    href: "#air-conditioners",
  },
  {
    label: "Dawlance Refrigerators",
    tagline: "Freshness that lasts",
    href: "#refrigerators",
  },
  {
    label: "National Air Coolers",
    tagline: "Breeze on a budget",
    href: "#air-coolers",
  },
];

export function AdBanner() {
  return (
    <section className="relative overflow-hidden bg-brand-950 py-14 sm:py-20">
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-gold-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-300">
            Now Showing
          </p>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold leading-tight text-white">
            This Season&apos;s
            <span className="bg-linear-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
              {" "}
              Featured Brands
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/70">
            Homage air conditioners, Dawlance refrigerators and National air
            coolers — three summer essentials, one cinematic showcase.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-brand-900/50">
          <video
            className="aspect-video w-full object-cover"
            src="/ads/appliances-ad.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {featured.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors hover:border-gold-400/40 hover:bg-white/10"
            >
              <p className="font-display text-base font-bold text-white group-hover:text-gold-300">
                {item.label}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-white/60">
                {item.tagline}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-300">
                Shop now
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
