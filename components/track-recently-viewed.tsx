"use client";

import { useEffect } from "react";
import { useTrackRecentlyViewedMutation } from "@/app/store/accountAPI";
import { selectCustomerIsAuthenticated } from "@/app/store/customerAuthSlice";
import { useAppSelector } from "@/lib/store/hooks";

export function TrackRecentlyViewed({ productId }: { productId: string }) {
  const isAuthenticated = useAppSelector(selectCustomerIsAuthenticated);
  const [track] = useTrackRecentlyViewedMutation();

  useEffect(() => {
    if (!isAuthenticated || !productId) return;
    void track({ productId });
  }, [isAuthenticated, productId, track]);

  return null;
}
