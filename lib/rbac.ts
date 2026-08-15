export const PERMISSIONS = [
  "PRODUCTS",
  "ORDERS",
  "USERS",
  "REPORTS",
  "COUPONS",
  "REVIEWS",
  "INVENTORY",
  "NOTIFICATIONS",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  roleId: string;
  roleName: string;
  rolePermissions: Permission[];
  extraPermissions: Permission[];
  permissions: Permission[];
  status: UserStatus | string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export const PERMISSION_LABEL: Record<Permission, string> = {
  PRODUCTS: "Catalog (products, categories, brands)",
  ORDERS: "Orders & delivery methods",
  USERS: "Users & roles",
  REPORTS: "Dashboard",
  COUPONS: "Coupons",
  REVIEWS: "Review moderation",
  INVENTORY: "Inventory & warehouses",
  NOTIFICATIONS: "Notifications & WhatsApp",
};

export const PERMISSION_SHORT_LABEL: Record<Permission, string> = {
  PRODUCTS: "Catalog",
  ORDERS: "Orders",
  USERS: "Users",
  REPORTS: "Dashboard",
  COUPONS: "Coupons",
  REVIEWS: "Reviews",
  INVENTORY: "Inventory",
  NOTIFICATIONS: "Notifications",
};

const STAFF_PERMISSIONS: Permission[] = [
  "USERS",
  "REPORTS",
  "INVENTORY",
  "COUPONS",
  "NOTIFICATIONS",
];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function normalizePermissions(values: unknown): Permission[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<Permission>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const next = value.trim().toUpperCase();
    if (isPermission(next) && !seen.has(next)) seen.add(next);
  }
  return [...seen];
}

export function permissionLabel(permission: string): string {
  const key = permission.trim().toUpperCase();
  if (isPermission(key)) return PERMISSION_LABEL[key];
  return permission;
}

export function permissionShortLabel(permission: string): string {
  const key = permission.trim().toUpperCase();
  if (isPermission(key)) return PERMISSION_SHORT_LABEL[key];
  return permission;
}

export function can(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  permission: Permission,
): boolean {
  return Boolean(user?.permissions.includes(permission));
}

export function canAny(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => can(user, permission));
}

export function isStaff(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role.trim().toUpperCase() !== "CUSTOMER") return true;
  return canAny(user, STAFF_PERMISSIONS);
}

export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.id !== "string" || typeof value.email !== "string") {
    return null;
  }

  return {
    id: value.id,
    email: value.email,
    firstName: typeof value.firstName === "string" ? value.firstName : "",
    lastName: typeof value.lastName === "string" ? value.lastName : "",
    phone: typeof value.phone === "string" ? value.phone : null,
    avatar: typeof value.avatar === "string" ? value.avatar : null,
    role: typeof value.role === "string" ? value.role : "",
    roleId: typeof value.roleId === "string" ? value.roleId : "",
    roleName: typeof value.roleName === "string" ? value.roleName : "",
    rolePermissions: normalizePermissions(value.rolePermissions),
    extraPermissions: normalizePermissions(value.extraPermissions),
    permissions: normalizePermissions(value.permissions),
    status: typeof value.status === "string" ? value.status : "ACTIVE",
    isEmailVerified: Boolean(value.isEmailVerified),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}
