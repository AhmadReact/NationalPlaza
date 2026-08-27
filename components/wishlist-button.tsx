"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getAccountProductId,
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from "@/app/store/accountAPI";
import { selectCustomerIsAuthenticated } from "@/app/store/customerAuthSlice";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

type WishlistButtonProps = {
  productId: string;
  className?: string;
  iconClassName?: string;
};

export function WishlistButton({
  productId,
  className,
  iconClassName = "h-4.5 w-4.5",
}: WishlistButtonProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectCustomerIsAuthenticated);
  const { data } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();
  const [pending, setPending] = useState(false);

  const inWishlist = useMemo(() => {
    if (!productId) return false;
    return (data?.data ?? []).some(
      (item) => getAccountProductId(item) === productId,
    );
  }, [data?.data, productId]);

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!productId || pending) return;

    if (!isAuthenticated) {
      router.push(
        `/login?next=${encodeURIComponent(pathname || `/account/wishlist`)}`,
      );
      return;
    }

    setPending(true);
    try {
      await toggleWishlist({ productId }).unwrap();
      dispatch(
        toast.success(
          inWishlist ? "Removed from wishlist" : "Added to wishlist",
        ),
      );
    } catch {
      // error toast handled by interceptor
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={inWishlist}
      disabled={pending || !productId}
      onClick={onClick}
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        fill={inWishlist ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        className={iconClassName}
      >
        <path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
      </svg>
    </button>
  );
}
