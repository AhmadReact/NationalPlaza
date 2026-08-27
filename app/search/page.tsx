import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SearchResults } from "@/app/search/search-client";

type PageProps = {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const query = firstParam((await searchParams).q).trim();
  if (!query) {
    return { title: "Search — National Electronics" };
  }

  return {
    title: `Search “${query}” — National Electronics`,
    description: `Search results for ${query} at National Electronics.`,
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const page = Math.max(1, Number(firstParam(params.page) || "1") || 1);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-10">
              <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-80 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          }
        >
          <SearchResults query={query} page={page} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
