import { Suspense } from "react";
import RegisterClient from "./register-client";

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
