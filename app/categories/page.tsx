import type { Metadata } from "next";
import Link from "next/link";
import { getArtKindForSlug } from "@/app/store/customerAPI";
import { fetchStoreCategoryTree } from "@/app/store/storefrontServer";
import { ApplianceArt } from "@/components/appliance-art";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Shop by Category — National Electronics",
  description:
    "Browse air conditioners, refrigerators, TVs and every home appliance category at National Electronics.",
};

export default async function CategoriesIndexPage() {
  const tree = await fetchStoreCategoryTree();
  const roots = tree.filter((node) => node.isActive !== false);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-950">
            Shop by Category
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Choose a category to filter by brand, price, stock, and product attributes.
          </p>

          {roots.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
              Categories will appear here once they are published.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {roots.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-slate-100 text-brand-800 group-hover:from-brand-900 group-hover:to-brand-700 group-hover:text-gold-300">
                    <ApplianceArt
                      kind={getArtKindForSlug(category.slug)}
                      className="h-8 w-8"
                    />
                  </span>
                  <h2 className="mt-3 font-semibold text-brand-950">
                    {category.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">View collection</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
