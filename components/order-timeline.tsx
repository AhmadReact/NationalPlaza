import {
  ORDER_TIMELINE_STEPS,
  type OrderStatus,
} from "@/lib/order/status";

const STEP_INDEX: Record<
  Extract<OrderStatus, "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED">,
  number
> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
};

export function OrderStatusTimeline({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  if (status === "CANCELLED" || status === "RETURNED") return null;
  if (!(status in STEP_INDEX)) return null;

  const currentIndex = STEP_INDEX[status as keyof typeof STEP_INDEX];

  return (
    <ol className={className ? `space-y-3 ${className}` : "space-y-3"}>
      {ORDER_TIMELINE_STEPS.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step.status} className="flex items-start gap-3">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                complete
                  ? "bg-brand-900 text-white"
                  : current
                    ? "bg-gold-400 text-brand-950"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {complete ? "✓" : index + 1}
            </span>
            <span
              className={`text-sm ${
                current
                  ? "font-semibold text-brand-950"
                  : complete
                    ? "text-brand-900"
                    : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
