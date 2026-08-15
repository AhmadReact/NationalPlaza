const GUEST_TOKEN_KEY = "guestToken";

export function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(GUEST_TOKEN_KEY);
  return token?.trim() || null;
}

export function setGuestToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_TOKEN_KEY, token);
}

export function clearGuestToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_TOKEN_KEY);
}
