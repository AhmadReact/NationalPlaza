import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  LoginApiError,
  loginRequest,
  type LoginCredentials,
  type LoginResponse,
} from "@/app/admin/login/store/loginAPI";

export const loginThunk = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return await loginRequest(credentials);
  } catch (error) {
    if (error instanceof LoginApiError) {
      return rejectWithValue(error.message);
    }

    if (error instanceof Error && error.message) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Unable to sign in. Please try again.");
  }
});
