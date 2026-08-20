"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { CheckoutOtpResult } from "@/app/store/checkoutAPI";

const OTP_LENGTH = 6;
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function onlyOtpDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

type CheckoutOtpModalProps = {
  open: boolean;
  phoneMasked: string;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
  verifying: boolean;
  error: string | null;
  onClose: () => void;
  onClearError?: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<CheckoutOtpResult | null>;
};

export function CheckoutOtpModal({
  open,
  phoneMasked,
  expiresInSeconds,
  resendAvailableInSeconds,
  verifying,
  error,
  onClose,
  onClearError,
  onVerify,
  onResend,
}: CheckoutOtpModalProps) {
  const titleId = useId();
  const hintId = useId();
  const errorId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const [code, setCode] = useState("");
  const [expiresLeft, setExpiresLeft] = useState(expiresInSeconds);
  const [resendLeft, setResendLeft] = useState(resendAvailableInSeconds);
  const [resending, setResending] = useState(false);
  const submitLockRef = useRef(false);

  const busy = verifying || resending;
  const expired = expiresLeft <= 0;
  const canResend = !busy && resendLeft <= 0;
  const canVerify = !busy && code.length === OTP_LENGTH;

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setCode("");
    setExpiresLeft(expiresInSeconds);
    setResendLeft(resendAvailableInSeconds);
    submitLockRef.current = false;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
    // Timer fields are applied from the render that opened the dialog.
    // Resend updates them through applyOtpSession, not by re-running this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      setExpiresLeft((value) => Math.max(0, value - 1));
      setResendLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open || verifying || !error) return;
    inputRef.current?.select();
  }, [open, verifying, error]);

  if (!open) return null;

  const describedBy = error ? `${hintId} ${errorId}` : hintId;

  const applyOtpSession = (session: CheckoutOtpResult) => {
    setCode("");
    setExpiresLeft(session.expiresInSeconds);
    setResendLeft(session.resendAvailableInSeconds);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submitCode = async (value: string) => {
    const otp = onlyOtpDigits(value);
    if (otp.length !== OTP_LENGTH || busy || submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    try {
      await onVerify(otp);
    } finally {
      submitLockRef.current = false;
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitCode(code);
  };

  const onCodeChange = (value: string) => {
    const otp = onlyOtpDigits(value);
    setCode(otp);
    if (error) onClearError?.();
    if (otp.length === OTP_LENGTH) {
      void submitCode(otp);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      const session = await onResend();
      if (session) applyOtpSession(session);
    } finally {
      setResending(false);
    }
  };

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (!busy) onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const nodes = [
      ...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ].filter((node) => node.offsetParent !== null || node === inputRef.current);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/40 p-4 sm:items-center"
      onKeyDown={trapFocus}
    >
      <button
        type="button"
        aria-label="Close verification dialog"
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
        disabled={busy}
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hintId}
        aria-busy={busy}
        className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
              WhatsApp verification
            </p>
            <h2
              id={titleId}
              className="mt-1 font-display text-2xl font-extrabold tracking-tight text-brand-950"
            >
              Enter your code
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-brand-950 disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <p id={hintId} className="mt-3 text-sm text-slate-600">
          OTP sent to WhatsApp {phoneMasked}. Enter the 6-digit code to confirm
          your order.
        </p>

        <form onSubmit={onSubmit} className="mt-6">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              6-digit code
            </span>
            <input
              ref={inputRef}
              id="checkout-otp-input"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck={false}
              pattern="\d{6}"
              maxLength={OTP_LENGTH}
              value={code}
              disabled={busy}
              aria-invalid={Boolean(error) || expired}
              aria-describedby={describedBy}
              onChange={(event) => onCodeChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center font-display text-2xl font-extrabold tracking-[0.4em] text-brand-950 outline-none focus:border-brand-600 disabled:opacity-60"
            />
          </label>

          <p
            className="mt-3 text-center text-xs font-semibold text-slate-500"
            aria-live="polite"
          >
            {expired
              ? "OTP expired. Please request a new code."
              : `Code expires in ${formatCountdown(expiresLeft)}`}
          </p>

          {error ? (
            <p
              id={errorId}
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canVerify}
            className="mt-5 w-full rounded-full bg-gold-400 py-3 text-sm font-bold text-brand-950 shadow-lg shadow-gold-500/25 transition-all hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? "Placing order…" : "Confirm order"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            disabled={!canResend}
            onClick={() => void handleResend()}
            className="text-sm font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            {resending
              ? "Sending a new code…"
              : canResend
                ? "Resend code"
                : `Resend in ${formatCountdown(resendLeft)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
