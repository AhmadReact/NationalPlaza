import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { clearAdminSessionCookie } from "@/app/admin/actions";
import { logout } from "@/app/admin/login/store/authSlice";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { toast } from "@/lib/store/snackbarSlice";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type BaseQueryExtraOptions = {
  /** When true, interceptor will not show an error toast */
  skipErrorToast?: boolean;
  /** When true, 401 will not logout / redirect (e.g. storefront cart probes) */
  skipAuthLogout?: boolean;
};

type TokenState = {
  auth?: { accessToken?: string | null };
  customerAuth?: { accessToken?: string | null };
};

function resolveUrl(args: string | FetchArgs): string {
  if (typeof args === "string") return args;
  return args.url ?? "";
}

function withAuthHeader(
  args: string | FetchArgs,
  token: string | null | undefined,
): string | FetchArgs {
  if (!token) return args;

  if (typeof args === "string") {
    return {
      url: args,
      headers: { authorization: `Bearer ${token}` },
    };
  }

  const headers = new Headers(args.headers as HeadersInit | undefined);
  if (!headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return { ...args, headers };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}/api`,
  prepareHeaders: (headers) => {
    headers.set("accept", "application/json");
    return headers;
  },
});

/** Lazy import avoids a TDZ cycle: slice → thunk → cartAPI → this file. */
async function dispatchCustomerLogout(dispatch: (action: unknown) => unknown) {
  const { customerLogout } = await import("@/app/store/customerAuthSlice");
  dispatch(customerLogout());
}

export const baseQueryWithInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  BaseQueryExtraOptions
> = async (args, api, extraOptions) => {
  const state = api.getState() as TokenState;
  const url = resolveUrl(args);
  const isCustomerRoute =
    url.includes("/customer/") || url.startsWith("customer/");
  const isGuestOrderRoute =
    url.includes("/guest/orders") || url.startsWith("guest/orders");

  const token = isGuestOrderRoute
    ? null
    : isCustomerRoute
      ? state.customerAuth?.accessToken
      : state.auth?.accessToken;

  const result = await rawBaseQuery(
    withAuthHeader(args, token),
    api,
    extraOptions,
  );

  if (result.error) {
    const status = result.error.status;
    const message = getFetchErrorMessage(result.error);

    if (!extraOptions?.skipErrorToast && status !== 403) {
      api.dispatch(toast.error(message));
    }

    if (status === 401 && !extraOptions?.skipAuthLogout) {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const onAdmin = path.startsWith("/admin");
        const onAdminLogin = path === "/admin/login";

        if (onAdmin) {
          api.dispatch(logout());
          try {
            await clearAdminSessionCookie();
          } catch {
            // ignore cookie clear failures
          }
          if (!onAdminLogin) {
            window.location.assign("/admin/login");
          }
        } else if (isCustomerRoute) {
          await dispatchCustomerLogout(api.dispatch);
        }
      } else if (isCustomerRoute) {
        await dispatchCustomerLogout(api.dispatch);
      } else {
        api.dispatch(logout());
      }
    }
  }

  return result;
};
