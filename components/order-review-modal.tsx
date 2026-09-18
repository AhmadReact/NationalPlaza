"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  useCreateGuestReviewMutation,
  useCreateProductReviewMutation,
} from "@/app/store/reviewAPI";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { isValidEmail } from "@/lib/email";
import {
  REVIEW_BODY_MAX,
  REVIEW_TITLE_MAX,
  classifyReviewSubmitError,
  trimReviewBody,
  trimReviewTitle,
} from "@/lib/reviews";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch } from "@/lib/store/hooks";
import { StarRatingInput } from "@/components/star-rating";

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export type OrderReviewTarget = {
  productId: string;
  productName: string;
};

type OrderReviewModalProps = {
  open: boolean;
  orderId: string;
  item: OrderReviewTarget | null;
  mode: "guest" | "customer";
  guestEmail?: string | null;
  onClose: () => void;
  onReviewed: (productId: string) => void;
  onHideItem: (productId: string) => void;
  onNotDelivered: () => void;
};

export function OrderReviewModal({
  open,
  item,
  ...props
}: OrderReviewModalProps) {
  if (!open || !item) return null;

  return (
    <OrderReviewDialog
      key={item.productId}
      item={item}
      {...props}
    />
  );
}

function OrderReviewDialog({
  orderId,
  item,
  mode,
  guestEmail,
  onClose,
  onReviewed,
  onHideItem,
  onNotDelivered,
}: Omit<OrderReviewModalProps, "open"> & { item: OrderReviewTarget }) {
  const dispatch = useAppDispatch();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [createGuestReview, { isLoading: guestSubmitting }] =
    useCreateGuestReviewMutation();
  const [createProductReview, { isLoading: customerSubmitting }] =
    useCreateProductReviewMutation();

  const knownEmail = guestEmail?.trim() ?? "";
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState(knownEmail);
  const [error, setError] = useState<string | null>(null);

  const needsEmail = mode === "guest" && !knownEmail;
  const submitting = guestSubmitting || customerSubmitting;

  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>("button[role='radio']")
        ?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, []);

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (!submitting) onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const nodes = [
      ...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ].filter((node) => node.offsetParent !== null);
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

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (rating < 1 || rating > 5) {
      setError("Choose a star rating.");
      return;
    }

    const submitEmail = (needsEmail ? email : knownEmail).trim().toLowerCase();
    if (mode === "guest") {
      if (!isValidEmail(submitEmail)) {
        setError("Enter the email you used at checkout.");
        return;
      }
    }

    const optionalTitle = trimReviewTitle(title);
    const optionalBody = trimReviewBody(body);
    setError(null);

    try {
      if (mode === "guest") {
        await createGuestReview({
          orderId,
          email: submitEmail,
          productId: item.productId,
          rating,
          ...(optionalTitle ? { title: optionalTitle } : {}),
          ...(optionalBody ? { body: optionalBody } : {}),
        }).unwrap();
      } else {
        await createProductReview({
          productId: item.productId,
          rating,
          ...(optionalTitle ? { title: optionalTitle } : {}),
          ...(optionalBody ? { body: optionalBody } : {}),
        }).unwrap();
      }
      dispatch(toast.success("Thanks for your review"));
      onReviewed(item.productId);
      onClose();
    } catch (submitError) {
      const issue = classifyReviewSubmitError(submitError);
      if (issue === "already_reviewed") {
        onReviewed(item.productId);
        onClose();
        return;
      }
      if (issue === "not_delivered") {
        onNotDelivered();
        onClose();
        return;
      }
      if (issue === "product_not_on_order" || issue === "product_not_found") {
        onHideItem(item.productId);
        onClose();
        return;
      }
      if (issue === "order_not_found") {
        setError("This order could not be reviewed.");
        return;
      }
      if (issue === "invalid_id") {
        setError("This order link is invalid.");
        return;
      }
      setError(
        getFetchErrorMessage(
          submitError as { status?: number | string; data?: unknown },
          "Could not submit your review.",
        ),
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/40 p-4 sm:items-center"
      onKeyDown={trapFocus}
    >
      <button
        type="button"
        aria-label="Close review dialog"
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
        disabled={submitting}
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
              Write a review
            </p>
            <h2
              id={titleId}
              className="mt-1 font-display text-2xl font-extrabold tracking-tight text-brand-950"
            >
              {item.productName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-brand-950 disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Rating
            </p>
            <div className="mt-1.5">
              <StarRatingInput
                value={rating}
                onChange={(next) => {
                  setRating(next);
                  if (error) setError(null);
                }}
                disabled={submitting}
              />
            </div>
          </div>

          {needsEmail ? (
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Checkout email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                disabled={submitting}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-600 disabled:opacity-60"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Title <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
            </span>
            <input
              type="text"
              maxLength={REVIEW_TITLE_MAX}
              value={title}
              disabled={submitting}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-600 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Review <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
            </span>
            <textarea
              rows={4}
              maxLength={REVIEW_BODY_MAX}
              value={body}
              disabled={submitting}
              onChange={(event) => setBody(event.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-600 disabled:opacity-60"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-900 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      </div>
    </div>
  );
}
