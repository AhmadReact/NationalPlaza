export type ApiErrorBody = {
  success?: boolean;
  message?: string | string[];
  error?: string;
  errors?: unknown;
};

export function extractApiErrorMessage(
  payload: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!payload) return fallback;

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (typeof payload !== "object") return fallback;

  const body = payload as ApiErrorBody;

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }

  if (Array.isArray(body.message)) {
    const first = body.message.find(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    if (first) return first;
  }

  if (typeof body.error === "string" && body.error.trim()) {
    return body.error;
  }

  if (Array.isArray(body.errors)) {
    const first = body.errors.find(
      (item) => typeof item === "string" && item.trim(),
    );
    if (typeof first === "string") return first;
  }

  if (body.errors && typeof body.errors === "object") {
    const values = Object.values(body.errors as Record<string, unknown>);
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
  }

  return fallback;
}

export function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === 404
  );
}

export function getFetchErrorMessage(
  error: { status?: number | string; data?: unknown; error?: string } | undefined,
  fallback = "Request failed.",
): string {
  if (!error) return fallback;

  if (error.status === "FETCH_ERROR") {
    return "Unable to reach the server. Check your connection.";
  }

  if (error.status === "TIMEOUT_ERROR") {
    return "Request timed out. Please try again.";
  }

  if (error.status === "PARSING_ERROR") {
    return "Received an invalid response from the server.";
  }

  return extractApiErrorMessage(error.data, fallback);
}
