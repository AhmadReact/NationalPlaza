import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        {children}
      </main>
      <Footer />
    </>
  );
}
