"use client";

import { useEffect } from "react";
import { useGetHomePageQuery } from "@/app/store/customerAPI";

/** Short TTL + refetch when the tab is focused so admin merchandising shows up quickly. */
export function useLiveHomePage() {
  const { refetch, ...query } = useGetHomePageQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: 45,
  });

  useEffect(() => {
    function onFocus() {
      void refetch();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetch]);

  return { refetch, ...query };
}
