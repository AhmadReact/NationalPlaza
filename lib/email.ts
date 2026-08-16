/** Basic RFC-style email check for checkout and admin test send. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CHECKOUT_EMAIL_HELPER =
  "We’ll send your order confirmation to this email.";

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (!email || email.length > 254) return false;
  return EMAIL_PATTERN.test(email);
}

/** Display mask like `a***@gmail.com`. */
export function maskEmail(value: string): string {
  const email = value.trim();
  const at = email.indexOf("@");
  if (at <= 0) {
    return email ? `${email.slice(0, 1)}***` : "";
  }
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const first = local.slice(0, 1);
  return `${first}***${domain}`;
}

export function resolveOrderNotifyEmail(
  order: { guestEmail?: string | null } | null | undefined,
  accountEmail?: string | null,
): string | null {
  const guest = order?.guestEmail?.trim();
  if (guest) return guest;
  const account = accountEmail?.trim();
  return account || null;
}
