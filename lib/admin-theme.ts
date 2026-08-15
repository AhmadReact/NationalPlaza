"use client";

import { createTheme } from "@mui/material/styles";

export const adminTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#1d2f8b",
      light: "#3a6df7",
      dark: "#0e1650",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#b45309",
      contrastText: "#0e1650",
    },
    success: {
      main: "#059669",
      light: "#d1fae5",
      dark: "#065f46",
    },
    warning: {
      main: "#d97706",
      light: "#fef3c7",
      dark: "#92400e",
    },
    error: {
      main: "#dc2626",
      light: "#fee2e2",
      dark: "#991b1b",
    },
    info: {
      main: "#244eec",
      light: "#dbe7fe",
      dark: "#1c3ad9",
    },
    background: {
      default: "#f4f6fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#10172a",
      secondary: "#64748b",
    },
    divider: "rgba(16, 23, 42, 0.08)",
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), "Segoe UI", sans-serif',
    h1: {
      fontFamily: 'var(--font-sora), var(--font-geist-sans), sans-serif',
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h2: {
      fontFamily: 'var(--font-sora), var(--font-geist-sans), sans-serif',
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: 'var(--font-sora), var(--font-geist-sans), sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontFamily: 'var(--font-sora), var(--font-geist-sans), sans-serif',
      fontWeight: 700,
    },
    h5: {
      fontFamily: 'var(--font-sora), var(--font-geist-sans), sans-serif',
      fontWeight: 700,
    },
    h6: {
      fontFamily: 'var(--font-sora), var(--font-geist-sans), sans-serif',
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
    overline: {
      letterSpacing: "0.14em",
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 14,
  },
  shadows: [
    "none",
    "0 1px 2px rgba(14, 22, 80, 0.04)",
    "0 2px 8px rgba(14, 22, 80, 0.06)",
    "0 8px 24px rgba(14, 22, 80, 0.08)",
    "0 12px 32px rgba(14, 22, 80, 0.1)",
    "0 16px 40px rgba(14, 22, 80, 0.12)",
    "0 20px 48px rgba(14, 22, 80, 0.14)",
    "0 24px 56px rgba(14, 22, 80, 0.16)",
    "0 1px 2px rgba(14, 22, 80, 0.04)",
    "0 2px 8px rgba(14, 22, 80, 0.06)",
    "0 8px 24px rgba(14, 22, 80, 0.08)",
    "0 12px 32px rgba(14, 22, 80, 0.1)",
    "0 16px 40px rgba(14, 22, 80, 0.12)",
    "0 20px 48px rgba(14, 22, 80, 0.14)",
    "0 24px 56px rgba(14, 22, 80, 0.16)",
    "0 1px 2px rgba(14, 22, 80, 0.04)",
    "0 2px 8px rgba(14, 22, 80, 0.06)",
    "0 8px 24px rgba(14, 22, 80, 0.08)",
    "0 12px 32px rgba(14, 22, 80, 0.1)",
    "0 16px 40px rgba(14, 22, 80, 0.12)",
    "0 20px 48px rgba(14, 22, 80, 0.14)",
    "0 24px 56px rgba(14, 22, 80, 0.16)",
    "0 1px 2px rgba(14, 22, 80, 0.04)",
    "0 2px 8px rgba(14, 22, 80, 0.06)",
    "0 8px 24px rgba(14, 22, 80, 0.08)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f4f6fb",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(16, 23, 42, 0.06)",
          boxShadow: "0 8px 24px rgba(14, 22, 80, 0.05)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#64748b",
          fontSize: "0.72rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          backgroundColor: "rgba(244, 246, 251, 0.9)",
        },
      },
    },
  },
});
