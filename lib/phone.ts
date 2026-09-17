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

/** Display a stored WhatsApp number (e.g. `923001234567`) as `+92 300 1234567`. */
export function formatWhatsAppPhoneDisplay(value: string): string {
  const digits = normalizePhoneInput(value).replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) {
    return `+92 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `+92 ${digits.slice(1, 4)} ${digits.slice(4)}`;
  }
  return value;
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
