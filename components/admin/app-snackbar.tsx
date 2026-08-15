"use client";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { hideSnackbar } from "@/lib/store/snackbarSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

export function AppSnackbar() {
  const dispatch = useAppDispatch();
  const { open, message, severity, autoHideDuration } = useAppSelector(
    (state) => state.snackbar,
  );

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={(_, reason) => {
        if (reason === "clickaway") return;
        dispatch(hideSnackbar());
      }}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={() => dispatch(hideSnackbar())}
        severity={severity}
        variant="filled"
        elevation={6}
        sx={{ width: "100%", alignItems: "center" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
