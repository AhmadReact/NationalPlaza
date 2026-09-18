"use client";

const STAR_PATH =
  "M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z";

function StarIcon({
  fill,
  className,
}: {
  fill: string;
  className: string;
}) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path fill={fill} d={STAR_PATH} />
    </svg>
  );
}

export function StarRatingDisplay({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const clamped = Math.max(0, Math.min(5, rating));
  const iconClass = size === "md" ? "size-5" : "size-3.5";

  return (
    <span
      className="inline-flex text-gold-500"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={iconClass}
          fill={clamped >= star ? "currentColor" : "#e2e8f0"}
        />
      ))}
    </span>
  );
}

export function StarRatingInput({
  value,
  onChange,
  disabled,
  name = "rating",
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const selected = value === star;
        const filled = value >= star;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            name={name}
            aria-checked={selected}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            className="rounded-md p-0.5 text-gold-500 transition-transform hover:scale-110 disabled:opacity-60"
          >
            <StarIcon
              className="size-7"
              fill={filled ? "currentColor" : "#e2e8f0"}
            />
          </button>
        );
      })}
    </div>
  );
}
