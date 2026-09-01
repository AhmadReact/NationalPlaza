import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterClient from "./register-client";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Create Account",
  robots: noIndexRobots,
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
