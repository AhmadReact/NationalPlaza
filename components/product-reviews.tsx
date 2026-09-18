"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useGetProductReviewSummaryQuery,
  useGetProductReviewsQuery,
} from "@/app/store/reviewAPI";
import { selectCustomerAccessToken } from "@/app/store/customerAuthSlice";
import { OrderReviewModal } from "@/components/order-review-modal";
import { StarRatingDisplay } from "@/components/star-rating";
import {
  reviewAuthorInitials,
  reviewAuthorName,
  summaryAverage,
  summaryStarCounts,
  summaryTotal,
  type Review,
  type ReviewAuthor,
} from "@/lib/reviews";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

function replyText(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const body = rec.body ?? rec.message ?? rec.text;
  return typeof body === "string" && body.trim() ? body.trim() : null;
}

function replyAuthor(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "Store";
  const rec = raw as Record<string, unknown>;
  const author = rec.author;
  if (author && typeof author === "object") {
    const name = reviewAuthorName(author as ReviewAuthor);
    if (name) return name;
  }
  const name = rec.authorName ?? rec.name;
  return typeof name === "string" && name.trim() ? name.trim() : "Store";
}

function ReviewCard({ review }: { review: Review }) {
  const author = review.author;
  const name = reviewAuthorName(author);
  const initials = reviewAuthorInitials(author);
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-PK", {
        dateStyle: "medium",
      })
    : "";
  const images = Array.isArray(review.images) ? review.images : [];
  const replies = Array.isArray(review.replies) ? review.replies : [];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {author?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatar}
            alt=""
            className="size-9 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-brand-900 text-[10px] font-bold text-gold-300">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-brand-950">{name}</p>
            {review.isVerifiedPurchase ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                Verified purchase
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StarRatingDisplay rating={review.rating} />
            {date ? <span className="text-[11px] text-slate-400">{date}</span> : null}
          </div>
        </div>
      </div>
      {review.title ? (
        <h3 className="mt-3 text-sm font-bold text-brand-950">{review.title}</h3>
      ) : null}
      {review.body ? (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{review.body}</p>
      ) : null}
      {images.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.id}
              src={image.url}
              alt=""
              className="h-16 w-16 rounded-lg object-cover"
            />
          ))}
        </div>
      ) : null}
      {replies.map((reply, index) => {
        const text = replyText(reply);
        if (!text) return null;
        const key =
          reply && typeof reply === "object" && "id" in reply && typeof reply.id === "string"
            ? reply.id
            : `reply-${index}`;
        return (
          <div
            key={key}
            className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
          >
            <p className="text-xs font-bold text-brand-900">{replyAuthor(reply)}</p>
            <p className="mt-1">{text}</p>
          </div>
        );
      })}
    </article>
  );
}

export function ProductReviews({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectCustomerAccessToken);
  const isLoggedIn = Boolean(accessToken);
  const [writing, setWriting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const { data: summaryData } = useGetProductReviewSummaryQuery(productId);
  const { data: listData, isLoading } = useGetProductReviewsQuery({
    productId,
    page: 1,
    limit: 20,
    sort: "newest",
  });

  const summary = summaryData?.data;
  const reviews = listData?.data ?? [];
  const total = summaryTotal(summary);
  const average = summaryAverage(summary);
  const starCounts = summaryStarCounts(summary);
  const maxCount = Math.max(1, ...starCounts);

  const writeTarget = useMemo(
    () => ({ productId, productName }),
    [productId, productName],
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
        <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-gold-400" />
        <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-brand-950">
          Customer reviews
        </h2>
        {total > 0 ? (
          <div className="mt-4 flex flex-wrap items-end gap-6">
            <div>
              <p className="font-display text-3xl font-extrabold text-brand-950">
                {average.toFixed(1)}
              </p>
              <StarRatingDisplay rating={average} size="md" />
              <p className="mt-1 text-xs text-slate-500">
                {total} review{total === 1 ? "" : "s"}
              </p>
            </div>
            <ul className="min-w-[12rem] flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starCounts[star - 1];
                return (
                  <li key={star} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-8 tabular-nums">{star}★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-gold-400"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 text-right tabular-nums">{count}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No reviews yet.</p>
        )}

        <div className="mt-4">
          {isLoggedIn && alreadyReviewed ? (
            <p className="text-sm font-semibold text-emerald-700">Reviewed</p>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={() => setWriting(true)}
              className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              Write a review
            </button>
          ) : (
            <p className="text-sm text-slate-500">
              Bought this? Rate it from your{" "}
              <Link
                href="/track-order"
                className="font-semibold text-brand-700 underline decoration-brand-700/40 underline-offset-2 hover:text-brand-900"
              >
                delivered order
              </Link>
              .{" "}
              <Link
                href="/login"
                className="font-semibold text-brand-700 underline decoration-brand-700/40 underline-offset-2 hover:text-brand-900"
              >
                Sign in
              </Link>{" "}
              if you ordered with an account.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 px-6 py-5 sm:px-8">
        {isLoading && reviews.length === 0 ? (
          <p className="text-sm text-slate-500">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <p className="text-sm text-slate-500">
            Be the first to share how this product worked for you.
          </p>
        )}
      </div>

      <OrderReviewModal
        open={writing}
        orderId=""
        item={writing ? writeTarget : null}
        mode="customer"
        onClose={() => setWriting(false)}
        onReviewed={() => {
          setAlreadyReviewed(true);
          setWriting(false);
        }}
        onHideItem={() => setWriting(false)}
        onNotDelivered={() => {
          setWriting(false);
          dispatch(
            toast.info("You can review this product after a delivered order."),
          );
        }}
      />
    </section>
  );
}
