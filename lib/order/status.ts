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

export const CHECKOUT_SHIPPING_HINT = "Shipping is calculated at checkout.";

export const LIVE_RATES_CITY_HINT =
  "Enter a real Pakistan city name (for example Lahore or Karachi) so we can quote shipping.";

export const PENDING_COURIER_NOTE =
  "Typically cheaper than live-rate couriers.";

export const PENDING_COURIER_CARD_NOTE = "Typically cheaper. No live fee.";

export const LIVE_RATES_CARD_NOTE = "Live shipping once city is set.";

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

export function methodQuotesLiveRates(method: {
  quotesLiveRates?: boolean;
}): boolean {
  return method.quotesLiveRates === true;
}

export function pickDefaultDeliveryMethodId<
  T extends { id: string; code?: string; quotesLiveRates?: boolean },
>(methods: T[]): string {
  if (methods.length === 0) return "";
  const preferred =
    methods.find((method) => method.code === "A_TO_Z") ??
    methods.find((method) => !methodQuotesLiveRates(method));
  return (preferred ?? methods[0]).id;
}

export function isCheckoutShippingPending(preview: {
  quotesLiveRates?: boolean;
  shippingPending?: boolean;
}): boolean {
  return preview.quotesLiveRates === false || preview.shippingPending === true;
}

export function orderNeedsShippingQuoteOnConfirm(order: {
  shippingPending?: boolean;
  shippingAmount?: number;
}): boolean {
  if (order.shippingPending === true) return true;
  return !(typeof order.shippingAmount === "number" && order.shippingAmount > 0);
}

export function isShippingPending(order: {
  shippingPending?: boolean;
  shippingAmount?: number;
  status?: string;
}): boolean {
  if (order.shippingPending === true) return true;
  if (order.shippingPending === false) return false;
  if (typeof order.shippingAmount === "number") {
    return order.shippingAmount === 0 && order.status === "PENDING";
  }
  return order.status === "PENDING";
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
  return message || "Pending";
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
