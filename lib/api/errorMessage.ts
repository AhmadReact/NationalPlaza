export type ApiFieldError = {
  field?: string;
  message: string;
  code?: string;
};

export type ApiErrorBody = {
  success?: boolean;
  message?: string | string[];
  error?: string;
  errors?: unknown;
};

function firstMessageFromErrorItems(errors: unknown): string | null {
  if (!Array.isArray(errors)) return null;

  for (const item of errors) {
    if (typeof item === "string" && item.trim()) return item.trim();
    if (item && typeof item === "object") {
      const message = (item as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }
    }
  }

  return null;
}

export function extractApiFieldErrors(payload: unknown): ApiFieldError[] {
  if (!payload || typeof payload !== "object") return [];
  const errors = (payload as ApiErrorBody).errors;
  if (!Array.isArray(errors)) return [];

  const fields: ApiFieldError[] = [];
  for (const item of errors) {
    if (!item || typeof item !== "object") continue;
    const rec = item as { field?: unknown; message?: unknown; code?: unknown };
    if (typeof rec.message !== "string" || !rec.message.trim()) continue;
    fields.push({
      field: typeof rec.field === "string" ? rec.field : undefined,
      message: rec.message.trim(),
      code: typeof rec.code === "string" ? rec.code : undefined,
    });
  }
  return fields;
}

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
  const fromErrors = firstMessageFromErrorItems(body.errors);
  if (fromErrors) return fromErrors;

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

  if (body.errors && typeof body.errors === "object") {
    const values = Object.values(body.errors as Record<string, unknown>);
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
  }

  return fallback;
}

export function getRtkErrorStatus(
  error: unknown,
): number | string | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }
  return (error as { status?: number | string }).status;
}

export function isNotFoundError(error: unknown): boolean {
  return getRtkErrorStatus(error) === 404;
}

export function isForbiddenError(error: unknown): boolean {
  return getRtkErrorStatus(error) === 403;
}

export function getRtkErrorData(error: unknown): unknown {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return undefined;
  }
  return (error as { data?: unknown }).data;
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
