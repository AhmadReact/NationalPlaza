const WHATSAPP_PHONE_HELPER =
  "Order updates will be sent on WhatsApp to this number.";

/** Pakistani mobile (`03…`, `92…`, `+92…`) or a rough E.164 number. */
const PK_LOCAL = /^03\d{9}$/;
const PK_COUNTRY = /^\+?92\d{10}$/;
const E164 = /^\+[1-9]\d{6,14}$/;

export const CHECKOUT_PHONE_HELPER = WHATSAPP_PHONE_HELPER;
export const CHECKOUT_PHONE_LABEL = "WhatsApp / mobile number";

export function normalizePhoneInput(value: string): string {
  return value.trim().replace(/[\s()-]/g, "");
}

export function isValidCheckoutPhone(value: string): boolean {
  const phone = normalizePhoneInput(value);
  if (!phone || phone.length > 20) return false;
  return PK_LOCAL.test(phone) || PK_COUNTRY.test(phone) || E164.test(phone);
}

/** Display mask like `0300***4567`. */
export function maskPhone(value: string): string {
  const compact = normalizePhoneInput(value);
  let digits = compact.replace(/\D/g, "");

  if (digits.startsWith("92") && digits.length === 12) {
    digits = `0${digits.slice(2)}`;
  }

  if (digits.length < 8) {
    return compact ? `${compact.slice(0, 2)}***` : "";
  }

  return `${digits.slice(0, 4)}***${digits.slice(-4)}`;
}

export type OrderPhoneSource = {
  shippingAddress?: { phone?: string | null } | null;
  guestPhone?: string | null;
  billingAddress?: { phone?: string | null } | null;
};

export function resolveOrderNotifyPhone(
  order: OrderPhoneSource | null | undefined,
): string | null {
  if (!order) return null;
  const candidates = [
    order.shippingAddress?.phone,
    order.guestPhone,
    order.billingAddress?.phone,
  ];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value;
  }
  return null;
}
