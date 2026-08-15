import type { Metadata } from "next";
import { Geist, Sora } from "next/font/google";
import { StoreProvider } from "@/lib/store/provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "National Electronics — Pakistan's Trusted Electronics Store Since 1946",
  description:
    "National Electronics has served Pakistan since 1946. Shop air conditioners, refrigerators, air coolers, LED TVs and all home appliances at the best prices with nationwide delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
