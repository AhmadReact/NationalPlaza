import type { Metadata } from "next";
import { ReduxProvider } from "@/lib/store/provider";

export const metadata: Metadata = {
  title: "Admin — National Electronics",
  description: "National Electronics store administration",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReduxProvider>
      <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
    </ReduxProvider>
  );
}
