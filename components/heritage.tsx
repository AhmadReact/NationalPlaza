const stats = [
  { value: "80", label: "Years in Business" },
  { value: "1,100+", label: "Products in Stock" },
  { value: "500k+", label: "Happy Customers" },
  { value: "4.9/5", label: "Average Rating" },
];

export function Heritage() {
  return (
    <section className="relative overflow-hidden bg-brand-950 py-14 sm:py-20">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-gold-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-300">
              Our Story
            </p>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold leading-tight text-white">
              Serving Pakistan
              <span className="block bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                since 1946
              </span>
            </h2>
            <p className="mt-5 max-w-lg text-sm sm:text-base leading-relaxed text-white/70">
              From a single shop opened in the year before independence to one of
              Pakistan&apos;s most trusted electronics retailers — National
              Electronics has spent eight decades bringing genuine, branded home
              appliances to Pakistani families at honest prices, backed by
              service you can count on.
            </p>
            <a
              href="#categories"
              className="mt-7 inline-block rounded-full bg-gold-400 px-7 py-3 text-sm font-bold text-brand-950 shadow-lg shadow-gold-500/25 transition-all hover:bg-gold-300 hover:-translate-y-0.5"
            >
              Explore Our Range
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur transition-colors hover:border-gold-400/40"
              >
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-gold-300">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
