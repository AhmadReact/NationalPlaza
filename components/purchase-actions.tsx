"use client";

import { useState } from "react";

export function PurchaseActions({ inStock = true }: { inStock?: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const addToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-full border-2 border-slate-200">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="px-4 py-2.5 text-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            −
          </button>
          <span className="min-w-10 text-center text-sm font-bold text-brand-950">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(9, q + 1))}
            aria-label="Increase quantity"
            className="px-4 py-2.5 text-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            +
          </button>
        </div>

        <button
          onClick={addToCart}
          disabled={!inStock}
          className={`flex-1 min-w-40 rounded-full px-7 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
            added
              ? "bg-emerald-600 shadow-emerald-600/25"
              : "bg-brand-900 shadow-brand-900/25 hover:bg-brand-700"
          }`}
        >
          {added ? "✓ Added to Cart" : "Add to Cart"}
        </button>

        <button
          aria-label="Add to wishlist"
          className="grid h-12 w-12 place-items-center rounded-full border-2 border-slate-200 text-slate-500 transition-all hover:border-red-300 hover:text-red-500"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
          </svg>
        </button>
      </div>

      <button className="mt-3 w-full rounded-full bg-gold-400 px-7 py-3 text-sm font-bold text-brand-950 shadow-lg shadow-gold-500/25 transition-all hover:bg-gold-300 hover:-translate-y-0.5">
        Buy It Now
      </button>

      <a
        href="https://wa.me/923001234567"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-emerald-500/40 bg-emerald-50 px-7 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .3-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.4 1.8 2.2 1.3 1.1 2.3 1.5 2.6 1.6.3.2.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .8-.2 1.5z" />
        </svg>
        Get Our Expert Advice on WhatsApp
      </a>
    </div>
  );
}
