import Link from "next/link";

export function PolicyShell({
  title,
  intro,
  contactPrompt,
  children,
}: {
  title: string;
  intro: string;
  contactPrompt: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-950">
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-brand-600/25 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <nav
            aria-label="Breadcrumb"
            className="text-xs font-medium text-white/50"
          >
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-gold-300">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gold-300">{title}</li>
            </ol>
          </nav>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-300">
            Legal
          </p>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            {intro}
          </p>
          <p className="mt-4 text-xs uppercase tracking-widest text-white/40">
            Last updated 15 August 2026
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px] lg:py-14">
        <article className="space-y-8">{children}</article>
        <aside>
          <div
            id="contact"
            className="scroll-mt-32 rounded-2xl border border-brand-900/10 bg-brand-950 p-6 text-brand-100 lg:sticky lg:top-28"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">
              {contactPrompt}
            </p>
            <h2 className="mt-2 font-display text-lg font-extrabold text-white">
              Contact us
            </h2>
            <ul className="mt-5 space-y-4 text-sm text-white/75">
              <li>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Address
                </p>
                <p className="mt-1">Thana Bazar, Arifwala, Pakistan</p>
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Phone / WhatsApp
                </p>
                <a
                  href="tel:+923344376840"
                  className="mt-1 block text-gold-300 hover:text-gold-200"
                >
                  +92 334 4376840
                </a>
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Email
                </p>
                <a
                  href="mailto:info@nationalelectronics.pk"
                  className="mt-1 block text-gold-300 hover:text-gold-200"
                >
                  info@nationalelectronics.pk
                </a>
              </li>
            </ul>
            <a
              href="https://wa.me/923344376840"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center rounded-full bg-gold-400 px-5 py-2.5 text-sm font-bold text-brand-950 transition-colors hover:bg-gold-300"
            >
              Message on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

export function PolicyCard({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-baseline gap-3">
        {number ? (
          <span className="font-display text-sm font-bold text-gold-600">
            {number}
          </span>
        ) : null}
        <h2 className="font-display text-xl font-extrabold text-brand-950">
          {title}
        </h2>
      </div>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

export function PolicyNote() {
  return (
    <p className="rounded-2xl border border-gold-200 bg-gold-50 px-5 py-4 text-sm leading-relaxed text-brand-950">
      <strong className="font-semibold">Note:</strong> National Electronics has
      complete authority to change the above policies at any time.
    </p>
  );
}
