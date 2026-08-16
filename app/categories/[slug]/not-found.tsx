import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function CategoryNotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-extrabold text-brand-950">
            Category not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This collection is unavailable or the link is incorrect.
          </p>
          <Link
            href="/categories"
            className="mt-6 inline-flex rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Browse categories
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
