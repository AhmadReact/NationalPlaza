export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export const DEFAULT_SHIPPING_MESSAGE =
  "Our representative will tell you the shipping charges.";

export const CUSTOMER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const ORDER_TIMELINE_STEPS = [
  { status: "PENDING" as const, label: "Placed — awaiting confirmation" },
  { status: "CONFIRMED" as const, label: "Confirmed" },
  { status: "SHIPPED" as const, label: "Shipped" },
  { status: "DELIVERED" as const, label: "Delivered" },
];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as string[]).includes(value);
}

export function normalizeDashboardOrderStatus(
  status: string,
): OrderStatus | null {
  if (status === "PAID" || status === "PACKED") return "CONFIRMED";
  if (isOrderStatus(status)) return status;
  return null;
}

export function orderStatusLabel(status: string): string {
  if (isOrderStatus(status)) return CUSTOMER_STATUS_LABEL[status];
  return status;
}

export function canCustomerCancel(status: string): boolean {
  return status === "PENDING" || status === "CONFIRMED";
}

export function isShippingPending(order: {
  shippingPending?: boolean;
  status?: string;
}): boolean {
  return order.shippingPending === true || order.status === "PENDING";
}

export function checkoutShippingCopy(preview: {
  shippingMessage?: string | null;
}): string {
  const message = preview.shippingMessage?.trim();
  return message || DEFAULT_SHIPPING_MESSAGE;
}

export function pendingShippingCopy(order: {
  shippingMessage?: string | null;
}): string {
  const message = order.shippingMessage?.trim();
  return message || "To be confirmed";
}

export function parseShippingAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

export function formatDeliveryEta(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    if (min === max) return `${min} day${min === 1 ? "" : "s"}`;
    return `${min}–${max} days`;
  }
  if (min != null) return `From ${min} day${min === 1 ? "" : "s"}`;
  return `Up to ${max} day${max === 1 ? "" : "s"}`;
}
