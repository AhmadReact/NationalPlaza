import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CustomerTokens,
  CustomerUser,
  CustomerAuthResult,
} from "@/app/store/customerAuthAPI";
import {
  customerLoginThunk,
  customerRegisterThunk,
} from "@/app/store/customerAuthThunk";

export type CustomerAuthState = {
  user: CustomerUser | null;
  tokens: CustomerTokens | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isAuthenticated: boolean;
};

const initialState: CustomerAuthState = {
  user: null,
  tokens: null,
  accessToken: null,
  refreshToken: null,
  status: "idle",
  error: null,
  isAuthenticated: false,
};

function applyAuthSuccess(
  state: CustomerAuthState,
  payload: CustomerAuthResult,
) {
  state.status = "succeeded";
  state.error = null;
  state.user = payload.user;
  state.tokens = payload.tokens;
  state.accessToken = payload.accessToken;
  state.refreshToken = payload.refreshToken;
  state.isAuthenticated = Boolean(payload.accessToken && payload.user);
}

const customerAuthSlice = createSlice({
  name: "customerAuth",
  initialState,
  reducers: {
    clearCustomerAuthError(state) {
      state.error = null;
    },
    /** Apply tokens immediately so follow-up cart calls send Authorization. */
    hydrateCustomerSession(
      state,
      action: PayloadAction<CustomerAuthResult>,
    ) {
      applyAuthSuccess(state, action.payload);
    },
    customerLogout(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(customerLoginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(customerLoginThunk.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload);
      })
      .addCase(customerLoginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Login failed.";
        state.isAuthenticated = false;
      })
      .addCase(customerRegisterThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(customerRegisterThunk.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload);
      })
      .addCase(customerRegisterThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Registration failed.";
        state.isAuthenticated = false;
      });
  },
});

export const {
  clearCustomerAuthError,
  hydrateCustomerSession,
  customerLogout,
} = customerAuthSlice.actions;
export const customerAuthReducer = customerAuthSlice.reducer;

export const selectCustomerAccessToken = (state: {
  customerAuth: CustomerAuthState;
}) => state.customerAuth.accessToken;

export const selectCustomerIsAuthenticated = (state: {
  customerAuth: CustomerAuthState;
}) => state.customerAuth.isAuthenticated;

export const selectCustomerUser = (state: {
  customerAuth: CustomerAuthState;
}) => state.customerAuth.user;
