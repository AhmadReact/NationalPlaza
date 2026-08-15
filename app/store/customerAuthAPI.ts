const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type CustomerUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type CustomerAuthData = {
  user: CustomerUser;
  tokens: CustomerTokens;
};

export type CustomerAuthResponse = {
  success: boolean;
  message: string;
  data: CustomerAuthData | null;
  errors: unknown;
  meta: unknown;
};

export type CustomerLoginInput = {
  email: string;
  password: string;
  guestToken?: string;
};

export type CustomerRegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  guestToken?: string;
};

export class CustomerAuthApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "CustomerAuthApiError";
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

async function postAuth(
  path: string,
  body: Record<string, unknown>,
): Promise<CustomerAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new CustomerAuthApiError(
      extractErrorMessage(payload, "Authentication failed."),
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
  }) as CustomerAuthResponse;
}

export async function customerLoginRequest(
  input: CustomerLoginInput,
): Promise<CustomerAuthResponse> {
  const body: Record<string, unknown> = {
    email: input.email,
    password: input.password,
  };
  if (input.guestToken) body.guestToken = input.guestToken;
  return postAuth("/auth/login", body);
}

export async function customerRegisterRequest(
  input: CustomerRegisterInput,
): Promise<CustomerAuthResponse> {
  const body: Record<string, unknown> = {
    email: input.email,
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
  };
  if (input.phone) body.phone = input.phone;
  if (input.guestToken) body.guestToken = input.guestToken;
  return postAuth("/auth/register", body);
}

export function getCustomerAccessToken(
  response: CustomerAuthResponse,
): string | null {
  const token = response.data?.tokens?.accessToken;
  return typeof token === "string" && token.trim() ? token : null;
}

export function getCustomerRefreshToken(
  response: CustomerAuthResponse,
): string | null {
  const token = response.data?.tokens?.refreshToken;
  return typeof token === "string" && token.trim() ? token : null;
}

export function getCustomerUser(
  response: CustomerAuthResponse,
): CustomerUser | null {
  return response.data?.user ?? null;
}

export type CustomerAuthResult = {
  user: CustomerUser | null;
  tokens: CustomerTokens | null;
  accessToken: string | null;
  refreshToken: string | null;
};

export function getCustomerDisplayName(
  user: CustomerUser | null | undefined,
): string {
  if (!user) return "Account";
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || user.email || "Account";
}
