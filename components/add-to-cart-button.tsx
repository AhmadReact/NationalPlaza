"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/store/cartThunk";
import { useAppDispatch } from "@/lib/store/hooks";

type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  idleLabel?: ReactNode;
  successLabel?: ReactNode;
};

export function AddToCartButton({
  productId,
  quantity = 1,
  disabled = false,
  className,
  idleLabel = "Add to Cart",
  successLabel = "✓ Added to Cart",
}: AddToCartButtonProps) {
  const dispatch = useAppDispatch();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!productId || pending || disabled) return;

    setPending(true);
    try {
      await dispatch(addToCart({ productId, quantity })).unwrap();
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    } catch {
      // error toast handled in thunk
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending || !productId}
      className={className}
    >
      {pending ? "Adding…" : added ? successLabel : idleLabel}
    </button>
  );
}

type BuyNowButtonProps = {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  idleLabel?: ReactNode;
  pendingLabel?: ReactNode;
};

export function BuyNowButton({
  productId,
  quantity = 1,
  disabled = false,
  className,
  idleLabel = "Buy It Now",
  pendingLabel = "Taking you to checkout…",
}: BuyNowButtonProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!productId || pending || disabled) return;

    setPending(true);
    try {
      await dispatch(
        addToCart({ productId, quantity, silentSuccess: true }),
      ).unwrap();
      router.push("/checkout");
    } catch {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending || !productId}
      className={className}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
