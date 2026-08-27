"use client";

import {
  useClearRecentlyViewedMutation,
  useGetRecentlyViewedQuery,
  useRemoveRecentlyViewedMutation,
} from "@/app/store/accountAPI";
import { AccountProductGrid } from "@/components/account/product-collection";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch } from "@/lib/store/hooks";

export default function RecentlyViewedPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetRecentlyViewedQuery();
  const [removeItem] = useRemoveRecentlyViewedMutation();
  const [clearAll] = useClearRecentlyViewedMutation();

  return (
    <AccountProductGrid
      title="Recently viewed"
      subtitle="The last products you looked at (up to 20)."
      emptyTitle="No recently viewed products yet."
      items={data?.data}
      loading={isLoading}
      clearLabel="Clear history"
      onClear={async () => {
        try {
          await clearAll().unwrap();
          dispatch(toast.success("Recently viewed cleared"));
        } catch {
          // interceptor toast
        }
      }}
      onRemove={async (productId) => {
        try {
          await removeItem(productId).unwrap();
          dispatch(toast.success("Removed from recently viewed"));
        } catch {
          // interceptor toast
        }
      }}
    />
  );
}
