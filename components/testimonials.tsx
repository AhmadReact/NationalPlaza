import { testimonials } from "@/lib/data";

export function Testimonials() {
  return (
    <section id="reviews" className="scroll-mt-32 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <span className="mx-auto block h-1.5 w-16 rounded-full bg-gradient-to-r from-gold-500 to-gold-300" />
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-950">
            Let Customers Speak For Us
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="flex text-gold-500">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
                </svg>
              ))}
            </span>
            <span className="text-sm text-slate-500">from 3,700+ verified reviews</span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((review) => (
            <figure
              key={review.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-900/10"
            >
              <span className="flex text-gold-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
                  </svg>
                ))}
              </span>
              <figcaption className="mt-3 text-sm font-bold text-brand-950">
                {review.title}
              </figcaption>
              <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                &ldquo;{review.quote}&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-900 text-xs font-bold text-gold-300">
                  {review.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">{review.name}</p>
                  <p className="text-[11px] text-slate-400">
                    Verified Buyer · {review.date}
                  </p>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
