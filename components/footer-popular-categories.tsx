"use client";

import Link from "next/link";
import { useLiveHomePage } from "@/app/store/useLiveHomePage";

export function FooterPopularCategories() {
  const { data } = useLiveHomePage();
  const categories = data?.data?.categories ?? [];
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Popular Categories">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gold-400">
        Popular Categories
      </h3>
      <ul className="mt-4 space-y-2.5">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={category.href || `/categories/${category.slug}`}
              className="text-sm text-white/60 transition-colors hover:text-gold-300"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
