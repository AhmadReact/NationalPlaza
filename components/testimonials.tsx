import { testimonials } from "@/lib/data";

export function Testimonials() {
  return (
    <section id="reviews" className="scroll-mt-32 py-5 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-center sm:text-center">
          <div>
            <span className="hidden h-1.5 w-16 rounded-full bg-gradient-to-r from-gold-500 to-gold-300 sm:mx-auto sm:block" />
            <h2 className="font-display text-lg font-extrabold tracking-tight text-balance text-brand-950 sm:mt-3 sm:text-3xl">
              Let Customers Speak For Us
            </h2>
            <div className="mt-1 flex items-center gap-1.5 sm:mt-3 sm:justify-center sm:gap-2">
              <span className="flex text-gold-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-3.5 sm:size-5"
                  >
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
                  </svg>
                ))}
              </span>
              <span className="text-[11px] text-slate-500 sm:text-sm">
                3,700+ reviews
              </span>
            </div>
          </div>
        </div>

        <div className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {testimonials.map((review) => (
            <figure
              key={review.name}
              className="flex w-[min(16.5rem,78vw)] shrink-0 snap-start flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:w-auto sm:rounded-2xl sm:p-6 sm:transition-all sm:duration-300 sm:hover:-translate-y-1 sm:hover:shadow-lg sm:hover:shadow-brand-900/10"
            >
              <span className="flex text-gold-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-3.5 sm:size-4"
                  >
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
                  </svg>
                ))}
              </span>
              <figcaption className="mt-2 line-clamp-1 text-[13px] font-bold text-brand-950 sm:mt-3 sm:text-sm">
                {review.title}
              </figcaption>
              <blockquote className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-snug text-pretty text-slate-500 sm:mt-2 sm:text-sm sm:leading-relaxed sm:line-clamp-none">
                &ldquo;{review.quote}&rdquo;
              </blockquote>
              <div className="mt-3 flex items-center gap-2.5 border-t border-slate-100 pt-3 sm:mt-4 sm:gap-3 sm:pt-4">
                <span className="grid size-7 place-items-center rounded-full bg-brand-900 text-[10px] font-bold text-gold-300 sm:size-9 sm:text-xs">
                  {review.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {review.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Verified · {review.date}
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
