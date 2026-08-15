import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  CustomerAuthApiError,
  customerLoginRequest,
  customerRegisterRequest,
  getCustomerAccessToken,
  getCustomerRefreshToken,
  getCustomerUser,
  type CustomerAuthResult,
  type CustomerLoginInput,
  type CustomerRegisterInput,
} from "@/app/store/customerAuthAPI";
import { hydrateCustomerSession } from "@/app/store/customerAuthSlice";
import { loadCart } from "@/app/store/cartThunk";
import { clearGuestToken, getGuestToken } from "@/lib/cart/guestToken";
import { toast } from "@/lib/store/snackbarSlice";

export type { CustomerAuthResult };

function toAuthResult(
  response: Awaited<ReturnType<typeof customerLoginRequest>>,
): CustomerAuthResult {
  return {
    user: getCustomerUser(response),
    tokens: response.data?.tokens ?? null,
    accessToken: getCustomerAccessToken(response),
    refreshToken: getCustomerRefreshToken(response),
  };
}

export const customerLoginThunk = createAsyncThunk<
  CustomerAuthResult,
  Omit<CustomerLoginInput, "guestToken">,
  { rejectValue: string }
>("customerAuth/login", async (credentials, { dispatch, rejectWithValue }) => {
  try {
    const guestToken = getGuestToken() ?? undefined;
    const response = await customerLoginRequest({
      ...credentials,
      guestToken,
    });
    const result = toAuthResult(response);
    if (!result.accessToken || !result.user) {
      return rejectWithValue("Login succeeded but no session was returned.");
    }
    dispatch(hydrateCustomerSession(result));
    clearGuestToken();
    await dispatch(loadCart());
    dispatch(toast.success(response.message || "Welcome back!"));
    return result;
  } catch (error) {
    const message =
      error instanceof CustomerAuthApiError
        ? error.message
        : "Login failed. Please try again.";
    dispatch(toast.error(message));
    return rejectWithValue(message);
  }
});

export const customerRegisterThunk = createAsyncThunk<
  CustomerAuthResult,
  Omit<CustomerRegisterInput, "guestToken">,
  { rejectValue: string }
>("customerAuth/register", async (input, { dispatch, rejectWithValue }) => {
  try {
    const guestToken = getGuestToken() ?? undefined;
    const response = await customerRegisterRequest({
      ...input,
      guestToken,
    });
    const result = toAuthResult(response);
    if (!result.accessToken || !result.user) {
      return rejectWithValue(
        "Registration succeeded but no session was returned.",
      );
    }
    dispatch(hydrateCustomerSession(result));
    clearGuestToken();
    await dispatch(loadCart());
    dispatch(toast.success(response.message || "Account created!"));
    return result;
  } catch (error) {
    const message =
      error instanceof CustomerAuthApiError
        ? error.message
        : "Registration failed. Please try again.";
    dispatch(toast.error(message));
    return rejectWithValue(message);
  }
});
