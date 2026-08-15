import { normalizeAuthUser, type AuthUser } from "@/lib/rbac";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type { AuthUser };

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type LoginData = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data: LoginData | null;
  errors: unknown;
  meta: unknown;
};

export class LoginApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "LoginApiError";
    this.status = status;
    this.payload = payload;
  }
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const body = payload as Record<string, unknown>;

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }

  if (Array.isArray(body.message) && typeof body.message[0] === "string") {
    return body.message[0];
  }

  if (typeof body.error === "string" && body.error.trim()) {
    return body.error;
  }

  return fallback;
}

export async function loginRequest(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(credentials),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new LoginApiError(
      extractErrorMessage(payload, "Invalid email or password."),
      response.status,
      payload,
    );
  }

  return (payload ?? {
    success: false,
    message: "Empty response",
    data: null,
    errors: null,
    meta: null,
  }) as LoginResponse;
}

export function getAccessToken(response: LoginResponse): string | null {
  const token = response.data?.tokens?.accessToken;
  return typeof token === "string" && token.trim() ? token : null;
}

export function getRefreshToken(response: LoginResponse): string | null {
  const token = response.data?.tokens?.refreshToken;
  return typeof token === "string" && token.trim() ? token : null;
}

export function getAuthUser(response: LoginResponse): AuthUser | null {
  return normalizeAuthUser(response.data?.user);
}

export function getUserDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return "Admin";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email || "Admin";
}
