import type { Metadata } from "next";
import { ReduxProvider } from "@/lib/store/provider";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Admin",
  description: "National Electronics store administration",
  robots: noIndexRobots,
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
