"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  clearAdminSessionCookie,
  logoutAdmin,
} from "@/app/admin/actions";
import { useLazyGetMeQuery } from "@/app/admin/login/store/authAPI";
import { logout, selectAuthUser, setAuthUser } from "@/app/admin/login/store/authSlice";
import { AdminForbidden } from "@/components/admin/forbidden";
import { permissionForPath } from "@/lib/admin-nav";
import { can, isStaff } from "@/lib/rbac";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import type { RootState } from "@/lib/store";

function selectRehydrated(state: RootState): boolean {
  return Boolean(
    (state as RootState & { _persist?: { rehydrated?: boolean } })._persist
      ?.rehydrated,
  );
}

export function AdminPermissionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const rehydrated = useAppSelector(selectRehydrated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector(selectAuthUser);
  const [getMe] = useLazyGetMeQuery();
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!rehydrated) return;

    if (!accessToken) {
      void logoutAdmin();
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    void getMe()
      .unwrap()
      .then((result) => {
        if (!result.data) return;
        dispatch(setAuthUser(result.data));
        if (!isStaff(result.data)) {
          dispatch(logout());
          void clearAdminSessionCookie().then(() => {
            window.location.assign("/");
          });
        }
      })
      .catch(() => {
        fetchingRef.current = false;
      });
  }, [accessToken, dispatch, getMe, rehydrated]);

  if (!rehydrated) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Loading session…
      </p>
    );
  }

  if (!accessToken || !user) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Restoring session…
      </p>
    );
  }

  if (!isStaff(user)) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Redirecting…
      </p>
    );
  }

  const required = permissionForPath(pathname);
  if (required && !can(user, required)) {
    return <AdminForbidden permission={required} />;
  }

  return children;
}
