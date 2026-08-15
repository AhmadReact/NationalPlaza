import type { PlaceOrderResult } from "@/app/store/checkoutAPI";

const LAST_ORDER_KEY = "lastPlacedOrder";

export function saveLastPlacedOrder(order: PlaceOrderResult): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore quota / private mode
  }
}

export function readLastPlacedOrder(
  orderId?: string,
): PlaceOrderResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const order = JSON.parse(raw) as PlaceOrderResult;
    if (orderId && order.id !== orderId) return null;
    return order;
  } catch {
    return null;
  }
}

export function clearLastPlacedOrder(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(LAST_ORDER_KEY);
}
