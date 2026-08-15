import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  getAccessToken,
  getAuthUser,
  getRefreshToken,
  type AuthTokens,
  type AuthUser,
  type LoginResponse,
} from "@/app/admin/login/store/loginAPI";
import { loginThunk } from "@/app/admin/login/store/loginThunk";
import { normalizeAuthUser } from "@/lib/rbac";

export type AuthState = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  accessToken: string | null;
  refreshToken: string | null;
  loginResponse: LoginResponse | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  user: null,
  tokens: null,
  accessToken: null,
  refreshToken: null,
  loginResponse: null,
  status: "idle",
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.tokens = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loginResponse = null;
      state.status = "idle";
      state.error = null;
      state.isAuthenticated = false;
    },
    setAuthUser(state, action: PayloadAction<AuthUser | null>) {
      const user = action.payload ? normalizeAuthUser(action.payload) : null;
      state.user = user;
      state.isAuthenticated = Boolean(state.accessToken && user);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        const response = action.payload;
        const accessToken = getAccessToken(response);
        const refreshToken = getRefreshToken(response);
        const user = getAuthUser(response);

        state.status = "succeeded";
        state.error = null;
        state.loginResponse = response;
        state.user = user;
        state.tokens = response.data?.tokens ?? null;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = Boolean(accessToken && user);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Login failed.";
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthError, logout, setAuthUser } = authSlice.actions;
export const authReducer = authSlice.reducer;

export function selectAuthUser(state: { auth: AuthState }): AuthUser | null {
  return normalizeAuthUser(state.auth.user);
}
