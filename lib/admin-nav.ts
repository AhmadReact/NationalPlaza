import { can, type AuthUser, type Permission } from "@/lib/rbac";

export type AdminIconName =
  | "dashboard"
  | "products"
  | "categories"
  | "brands"
  | "banners"
  | "home"
  | "orders"
  | "customers"
  | "users"
  | "roles"
  | "coupons"
  | "inventory"
  | "reviews"
  | "shipping"
  | "reports"
  | "whatsapp"
  | "email"
  | "settings";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: AdminIconName;
  permission?: Permission;
};

export type AdminNavGroup = {
  id: string;
  label: string | null;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "insights",
    label: "Insights",
    items: [
      { label: "Dashboard", href: "/admin", icon: "dashboard", permission: "REPORTS" },
      { label: "Reports", href: "/admin/reports", icon: "reports", permission: "REPORTS" },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: "products", permission: "PRODUCTS" },
      { label: "Categories", href: "/admin/categories", icon: "categories", permission: "PRODUCTS" },
      { label: "Homepage", href: "/admin/home", icon: "home", permission: "PRODUCTS" },
      { label: "Brands", href: "/admin/brands", icon: "brands", permission: "PRODUCTS" },
      { label: "Banners", href: "/admin/banners", icon: "banners", permission: "PRODUCTS" },
    ],
  },
  {
    id: "fulfillment",
    label: "Fulfillment",
    items: [
      { label: "Orders", href: "/admin/orders", icon: "orders", permission: "ORDERS" },
      { label: "Delivery", href: "/admin/delivery-methods", icon: "shipping", permission: "ORDERS" },
    ],
  },
  {
    id: "stock",
    label: "Stock",
    items: [
      { label: "Inventory", href: "/admin/inventory", icon: "inventory", permission: "INVENTORY" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { label: "Coupons", href: "/admin/coupons", icon: "coupons", permission: "COUPONS" },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { label: "Reviews", href: "/admin/reviews", icon: "reviews", permission: "REVIEWS" },
    ],
  },
  {
    id: "messaging",
    label: "Messaging",
    items: [
      {
        label: "WhatsApp",
        href: "/admin/whatsapp",
        icon: "whatsapp",
        permission: "NOTIFICATIONS",
      },
      {
        label: "Email",
        href: "/admin/email",
        icon: "email",
        permission: "NOTIFICATIONS",
      },
    ],
  },
  {
    id: "access",
    label: "Access",
    items: [
      { label: "Users", href: "/admin/users", icon: "users", permission: "USERS" },
      { label: "Roles", href: "/admin/roles", icon: "roles", permission: "USERS" },
    ],
  },
  {
    id: "store",
    label: null,
    items: [{ label: "Settings", href: "/admin/settings", icon: "settings" }],
  },
];

/** Flat list kept for callers that do not need grouping. */
export const adminNav: AdminNavItem[] = adminNavGroups.flatMap(
  (group) => group.items,
);

export function visibleNavGroups(user: AuthUser | null | undefined): AdminNavGroup[] {
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || can(user, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

const PATH_PERMISSIONS: Array<[string, Permission | null]> = [
  ["/admin/products", "PRODUCTS"],
  ["/admin/categories", "PRODUCTS"],
  ["/admin/home", "PRODUCTS"],
  ["/admin/brands", "PRODUCTS"],
  ["/admin/banners", "PRODUCTS"],
  ["/admin/orders", "ORDERS"],
  ["/admin/delivery-methods", "ORDERS"],
  ["/admin/shipping", "ORDERS"],
  ["/admin/inventory", "INVENTORY"],
  ["/admin/coupons", "COUPONS"],
  ["/admin/reviews", "REVIEWS"],
  ["/admin/whatsapp", "NOTIFICATIONS"],
  ["/admin/email", "NOTIFICATIONS"],
  ["/admin/reports", "REPORTS"],
  ["/admin/users", "USERS"],
  ["/admin/roles", "USERS"],
  ["/admin/customers", "USERS"],
  ["/admin/settings", null],
  ["/admin", null],
];

export function permissionForPath(pathname: string): Permission | null {
  const match = PATH_PERMISSIONS.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match ? match[1] : null;
}
