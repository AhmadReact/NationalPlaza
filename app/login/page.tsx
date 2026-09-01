import type { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "./login-client";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign In",
  robots: noIndexRobots,
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
