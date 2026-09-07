const stats = [
  { value: "80", label: "Years in Business" },
  { value: "1,100+", label: "Products in Stock" },
  { value: "500k+", label: "Happy Customers" },
  { value: "4.9/5", label: "Average Rating" },
];

export function Heritage() {
  return (
    <section className="relative overflow-hidden bg-brand-950 py-7 sm:py-20">
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
        <div className="grid items-center gap-5 sm:gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold-300 sm:px-4 sm:py-1.5 sm:text-xs">
              Our Story
            </p>
            <h2 className="mt-2.5 font-display text-xl font-extrabold leading-tight text-balance text-white sm:mt-4 sm:text-4xl">
              Serving Pakistan
              <span className="block bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                since 1946
              </span>
            </h2>
            <p className="mt-2.5 hidden max-w-lg text-pretty text-sm leading-relaxed text-white/70 sm:mt-5 sm:block sm:text-base">
              From a single shop opened in the year before independence to one of
              Pakistan&apos;s most trusted electronics retailers — National
              Electronics has spent eight decades bringing genuine, branded home
              appliances to Pakistani families at honest prices, backed by
              service you can count on.
            </p>
            <a
              href="#categories"
              className="mt-4 inline-block rounded-full bg-gold-400 px-4 py-2 text-xs font-bold text-brand-950 shadow-lg shadow-gold-500/25 transition-all hover:bg-gold-300 sm:mt-7 sm:px-7 sm:py-3 sm:text-sm sm:hover:-translate-y-0.5"
            >
              Explore Our Range
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-3 text-center sm:rounded-2xl sm:p-6 sm:transition-colors sm:hover:border-gold-400/40"
              >
                <p className="font-display text-xl font-extrabold tabular-nums text-gold-300 sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-white/60 sm:mt-1 sm:text-xs sm:uppercase sm:tracking-widest">
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
