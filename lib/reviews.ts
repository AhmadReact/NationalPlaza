import {
  getFetchErrorMessage,
  getRtkErrorStatus,
} from "@/lib/api/errorMessage";

export type ReviewStatus = "PENDING" | "APPROVED" | "HIDDEN" | "REJECTED";

export type ReviewAuthor = {
  id: string | null;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
};

export type ReviewImage = {
  id: string;
  url: string;
  sortOrder: number;
  createdAt: string;
};

export type Review = {
  id: string;
  productId: string;
  userId: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  viewerHasVotedHelpful: boolean;
  author: ReviewAuthor;
  images: ReviewImage[];
  replies: unknown[];
  createdAt: string;
  updatedAt: string;
};

export type ReviewSummary = {
  productId?: string;
  averageRating: number;
  totalReviews?: number;
  reviewCount?: number;
  ratingCounts?: Record<string, number> | number[];
};

export type ReviewSubmitIssue =
  | "already_reviewed"
  | "not_delivered"
  | "product_not_on_order"
  | "product_not_found"
  | "order_not_found"
  | "invalid_id"
  | "unknown";

const TITLE_MAX = 120;
const BODY_MAX = 5000;

export const REVIEW_TITLE_MAX = TITLE_MAX;
export const REVIEW_BODY_MAX = BODY_MAX;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : null;
}

export function normalizeReviewAuthor(raw: unknown): ReviewAuthor {
  const rec = asRecord(raw) ?? {};
  return {
    id: asNullableString(rec.id),
    firstName: asString(rec.firstName),
    lastName: asString(rec.lastName),
    avatar: asNullableString(rec.avatar),
    role: asString(rec.role),
  };
}

export function normalizeReview(raw: unknown): Review | null {
  const rec = asRecord(raw);
  if (!rec || typeof rec.id !== "string") return null;

  const images = Array.isArray(rec.images)
    ? rec.images
        .map((item): ReviewImage | null => {
          const image = asRecord(item);
          if (!image || typeof image.id !== "string" || typeof image.url !== "string") {
            return null;
          }
          return {
            id: image.id,
            url: image.url,
            sortOrder: Number(image.sortOrder) || 0,
            createdAt: asString(image.createdAt),
          };
        })
        .filter((item): item is ReviewImage => item !== null)
    : [];

  const status = asString(rec.status);
  const rating = Number(rec.rating);

  return {
    id: rec.id,
    productId: asString(rec.productId),
    userId: asNullableString(rec.userId),
    rating: Number.isFinite(rating) ? rating : 0,
    title: asNullableString(rec.title),
    body: asNullableString(rec.body),
    status: (status as ReviewStatus) || "APPROVED",
    isVerifiedPurchase: rec.isVerifiedPurchase === true,
    helpfulCount: Number(rec.helpfulCount) || 0,
    viewerHasVotedHelpful: rec.viewerHasVotedHelpful === true,
    author: normalizeReviewAuthor(rec.author),
    images,
    replies: Array.isArray(rec.replies) ? rec.replies : [],
    createdAt: asString(rec.createdAt),
    updatedAt: asString(rec.updatedAt),
  };
}

export function reviewAuthorName(author: ReviewAuthor | null | undefined): string {
  const first = author?.firstName?.trim() ?? "";
  const last = author?.lastName?.trim() ?? "";
  if (author?.role === "GUEST" && !last) {
    return first || "Guest";
  }
  return [first, last].filter(Boolean).join(" ") || "Customer";
}

export function reviewAuthorInitials(author: ReviewAuthor | null | undefined): string {
  const first = author?.firstName?.trim() ?? "";
  const last = author?.lastName?.trim() ?? "";
  const letters = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return letters || "G";
}

export function summaryTotal(summary: ReviewSummary | null | undefined): number {
  if (!summary) return 0;
  const total = Number(summary.totalReviews ?? summary.reviewCount ?? 0);
  return Number.isFinite(total) ? total : 0;
}

export function summaryAverage(summary: ReviewSummary | null | undefined): number {
  if (!summary) return 0;
  const average = Number(summary.averageRating ?? 0);
  return Number.isFinite(average) ? average : 0;
}

export function summaryStarCounts(
  summary: ReviewSummary | null | undefined,
): [number, number, number, number, number] {
  const counts: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  const raw = summary?.ratingCounts;
  if (Array.isArray(raw)) {
    for (let i = 0; i < 5; i += 1) {
      counts[i] = Number(raw[i]) || 0;
    }
    return counts;
  }
  if (raw && typeof raw === "object") {
    for (let star = 1; star <= 5; star += 1) {
      const value = (raw as Record<string, number>)[String(star)] ?? (raw as Record<string, number>)[star];
      counts[star - 1] = Number(value) || 0;
    }
  }
  return counts;
}

export function classifyReviewSubmitError(error: unknown): ReviewSubmitIssue {
  const status = getRtkErrorStatus(error);
  const message = getFetchErrorMessage(
    error as { status?: number | string; data?: unknown },
    "",
  ).toLowerCase();

  if (message.includes("already reviewed")) return "already_reviewed";
  if (
    message.includes("after the order is delivered") ||
    (message.includes("review") && message.includes("delivered"))
  ) {
    return "not_delivered";
  }
  if (message.includes("not on the order")) return "product_not_on_order";
  if (
    message.includes("not a uuid") ||
    message.includes("invalid uuid") ||
    message.includes("must be a uuid")
  ) {
    return "invalid_id";
  }
  if (message.includes("product not found") || message.includes("product is not found")) {
    return "product_not_found";
  }

  if (status === 404) {
    if (message.includes("product")) return "product_not_found";
    return "order_not_found";
  }

  return "unknown";
}

export function trimReviewTitle(value: string): string {
  return value.trim().slice(0, TITLE_MAX);
}

export function trimReviewBody(value: string): string {
  return value.trim().slice(0, BODY_MAX);
}
