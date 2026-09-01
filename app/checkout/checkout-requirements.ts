import type { GuestCheckoutAddressInput } from "@/app/store/checkoutAPI";
import { isValidEmail } from "@/lib/email";
import { isValidCheckoutPhone } from "@/lib/phone";

export type CheckoutBlockersInput = {
  isAuthenticated: boolean;
  guestEmail: string;
  guestPhone: string;
  guestShipping: GuestCheckoutAddressInput;
  deliveryMethodId: string;
  shippingAddressId: string;
  hasAddresses: boolean;
  selectedAddressPhoneOk: boolean;
  hasGuestToken: boolean;
};

export function getCheckoutBlockers({
  isAuthenticated,
  guestEmail,
  guestPhone,
  guestShipping,
  deliveryMethodId,
  shippingAddressId,
  hasAddresses,
  selectedAddressPhoneOk,
  hasGuestToken,
}: CheckoutBlockersInput): string[] {
  const missing: string[] = [];

  if (!deliveryMethodId) {
    missing.push("Delivery method");
  }

  if (isAuthenticated) {
    if (!hasAddresses) {
      missing.push("Save a shipping address");
    } else if (!shippingAddressId) {
      missing.push("Select a shipping address");
    } else if (!selectedAddressPhoneOk) {
      missing.push("A WhatsApp / mobile number on the selected address");
    }
    return missing;
  }

  if (!hasGuestToken) {
    missing.push("Items in your cart");
  }

  const email = guestEmail.trim();
  if (!email) missing.push("Email");
  else if (!isValidEmail(guestEmail)) {
    missing.push("A valid email (for example name@example.com)");
  }

  const contactPhone = guestPhone.trim();
  if (!contactPhone) missing.push("WhatsApp / mobile number");
  else if (!isValidCheckoutPhone(guestPhone)) {
    missing.push(
      "A valid WhatsApp / mobile number (03XXXXXXXXX, +92…, or 92…)",
    );
  }

  if (guestShipping.fullName.trim().length < 2) {
    missing.push("Full name");
  }
  if (guestShipping.line1.trim().length < 2) {
    missing.push("Address line 1");
  }
  if (guestShipping.city.trim().length < 2) {
    missing.push("City");
  }

  const shippingPhone = guestShipping.phone?.trim() ?? "";
  if (
    shippingPhone &&
    shippingPhone !== contactPhone &&
    !isValidCheckoutPhone(shippingPhone)
  ) {
    missing.push("A valid shipping phone number");
  }

  return missing;
}

export function filledButInvalid(
  value: string,
  ok: (value: string) => boolean,
): boolean {
  return value.trim().length > 0 && !ok(value);
}

export function filledButTooShort(value: string, min = 2): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length < min;
}
