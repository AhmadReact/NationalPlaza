import { Suspense } from "react";
import OrderClient from "./order-client";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-slate-500">
          Loading order…
        </div>
      }
    >
      <OrderClient id={id} />
    </Suspense>
  );
}
