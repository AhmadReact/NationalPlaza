"use client";

import {
  useClearWishlistMutation,
  useGetWishlistQuery,
  useRemoveWishlistItemMutation,
} from "@/app/store/accountAPI";
import { AccountProductGrid } from "@/components/account/product-collection";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch } from "@/lib/store/hooks";

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetWishlistQuery();
  const [removeItem] = useRemoveWishlistItemMutation();
  const [clearAll] = useClearWishlistMutation();

  return (
    <AccountProductGrid
      title="Wishlist"
      subtitle="Saved products you can add to cart anytime."
      emptyTitle="Your wishlist is empty."
      items={data?.data}
      loading={isLoading}
      clearLabel="Clear wishlist"
      onClear={async () => {
        try {
          await clearAll().unwrap();
          dispatch(toast.success("Wishlist cleared"));
        } catch {
          // interceptor toast
        }
      }}
      onRemove={async (productId) => {
        try {
          await removeItem(productId).unwrap();
          dispatch(toast.success("Removed from wishlist"));
        } catch {
          // interceptor toast
        }
      }}
    />
  );
}
