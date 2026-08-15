import { can, type AuthUser, type Permission } from "@/lib/rbac";

export type AdminAuthUserLike = {
  role?: string | null;
  permissions?: string[] | null;
};

function asAuthUser(
  user: AdminAuthUserLike | AuthUser | null | undefined,
): Pick<AuthUser, "permissions"> | null {
  if (!user) return null;
  return {
    permissions: (user.permissions ?? []).map((item) =>
      item.trim().toUpperCase(),
    ) as AuthUser["permissions"],
  };
}

export function hasAdminPermission(
  user: AdminAuthUserLike | null | undefined,
  permission: string,
): boolean {
  const wanted = permission.trim().toUpperCase();
  return (user?.permissions ?? []).some(
    (item) => item.trim().toUpperCase() === wanted,
  );
}

/** Gate WhatsApp / notifications UI on effective permissions, not role slugs. */
export function canAccessWhatsAppAdmin(
  user: AdminAuthUserLike | null | undefined,
): boolean {
  return can(asAuthUser(user), "NOTIFICATIONS");
}

export function canAccessAdminModule(
  user: AdminAuthUserLike | AuthUser | null | undefined,
  permission: Permission,
): boolean {
  return can(asAuthUser(user), permission);
}

export const ADMIN_COOKIE = "ne_admin_session";

/** Fallback display name when auth user is not hydrated yet */
export const ADMIN_DEMO = {
  email: "admin@example.com",
  password: "Admin123!",
  name: "Admin User",
} as const;
