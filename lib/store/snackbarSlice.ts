import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SnackbarSeverity = "success" | "info" | "warning" | "error";

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
  autoHideDuration: number;
};

const initialState: SnackbarState = {
  open: false,
  message: "",
  severity: "info",
  autoHideDuration: 5000,
};

type ShowSnackbarPayload = {
  message: string;
  severity?: SnackbarSeverity;
  autoHideDuration?: number;
};

const snackbarSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    showSnackbar(state, action: PayloadAction<ShowSnackbarPayload>) {
      state.open = true;
      state.message = action.payload.message;
      state.severity = action.payload.severity ?? "info";
      state.autoHideDuration = action.payload.autoHideDuration ?? 5000;
    },
    hideSnackbar(state) {
      state.open = false;
    },
  },
});

export const { showSnackbar, hideSnackbar } = snackbarSlice.actions;
export const snackbarReducer = snackbarSlice.reducer;

export const toast = {
  success: (message: string) =>
    showSnackbar({ message, severity: "success" }),
  error: (message: string) => showSnackbar({ message, severity: "error" }),
  warning: (message: string) =>
    showSnackbar({ message, severity: "warning" }),
  info: (message: string) => showSnackbar({ message, severity: "info" }),
};
