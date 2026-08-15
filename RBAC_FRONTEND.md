# Frontend guide: users, roles, extra permissions

Use this NestJS API as the source of truth for access control. Do **not** hardcode `ADMIN` / `MANAGER` / `SALES` to show or hide admin modules. Gate the UI on **effective permissions**.

- Base URL: `{API_HOST}/api`
- Auth header: `Authorization: Bearer <access_token>`
- Envelope on every response:

```ts
{
  success: boolean;
  message: string;
  data: T | null;
  errors: Array<{ field?: string; message: string; code?: string }> | null;
  meta: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  } | null;
}
```

403 = missing permission. Hide the nav item **and** still handle 403 on the page (deep links, stale session).

---

## 1. Types

```ts
type Permission =
  | 'PRODUCTS'
  | 'ORDERS'
  | 'USERS'
  | 'REPORTS'
  | 'COUPONS'
  | 'REVIEWS'
  | 'INVENTORY'
  | 'NOTIFICATIONS';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: string;          // slug, e.g. "SALES" or "warehouse-clerk"
  roleId: string;
  roleName: string;
  rolePermissions: Permission[];
  extraPermissions: Permission[];
  permissions: Permission[]; // USE THIS for UI + route guards
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type Role = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
};
```

`permissions` is already the union of role + extras. If `role === 'ADMIN'`, the API always returns every permission.

Do not decode the JWT for permissions. The access token only stores `sub`, `email`, and role slug. Permissions are loaded from the DB on every request.

---

## 2. Session: where permissions come from

After login / register / refresh, `data.user.permissions` is the list to store.

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
GET  /api/auth/me
GET  /api/auth/rbac   → { role, roleId, permissions }
```

### Login

```http
POST /api/auth/login
{ "email": "admin@example.com", "password": "Admin123!" }
```

```ts
// data
{
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number; // seconds
  };
}
```

Store:

1. `accessToken` / `refreshToken`
2. `user` (including `permissions`, `role`, `roleId`)

On app boot, if a token exists, call `GET /api/auth/me` and replace the cached user. Permissions can change while the token is still valid (role edit, extra grants).

Suggested helper:

```ts
function can(user: AuthUser | null, permission: Permission): boolean {
  return Boolean(user?.permissions.includes(permission));
}

function canAny(user: AuthUser | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(user, p));
}
```

---

## 3. Show modules from permissions (admin nav)

This is the mapping that matches the backend. One permission can unlock several screens.

| Permission        | Admin modules to show |
|-------------------|------------------------|
| `REPORTS`         | Dashboard / analytics |
| `PRODUCTS`        | Products, Categories, Brands |
| `ORDERS`          | Orders (admin list/status/invoice), Delivery methods |
| `INVENTORY`       | Inventory, Warehouses |
| `COUPONS`         | Coupons |
| `REVIEWS`         | Review moderation (`/reviews` admin) |
| `NOTIFICATIONS`   | Notifications, Templates, WhatsApp |
| `USERS`           | Users, Roles |

Example nav config:

```ts
type NavItem = {
  label: string;
  href: string;
  permission: Permission;
};

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', permission: 'REPORTS' },
  { label: 'Products', href: '/admin/products', permission: 'PRODUCTS' },
  { label: 'Categories', href: '/admin/categories', permission: 'PRODUCTS' },
  { label: 'Brands', href: '/admin/brands', permission: 'PRODUCTS' },
  { label: 'Orders', href: '/admin/orders', permission: 'ORDERS' },
  { label: 'Delivery', href: '/admin/delivery-methods', permission: 'ORDERS' },
  { label: 'Inventory', href: '/admin/inventory', permission: 'INVENTORY' },
  { label: 'Warehouses', href: '/admin/warehouses', permission: 'INVENTORY' },
  { label: 'Coupons', href: '/admin/coupons', permission: 'COUPONS' },
  { label: 'Reviews', href: '/admin/reviews', permission: 'REVIEWS' },
  { label: 'Notifications', href: '/admin/notifications', permission: 'NOTIFICATIONS' },
  { label: 'WhatsApp', href: '/admin/whatsapp', permission: 'NOTIFICATIONS' },
  { label: 'Users', href: '/admin/users', permission: 'USERS' },
  { label: 'Roles', href: '/admin/roles', permission: 'USERS' },
];

function visibleNav(user: AuthUser) {
  return ADMIN_NAV.filter((item) => can(user, item.permission));
}
```

Group in the sidebar if you want:

- **Catalog** — Products, Categories, Brands (`PRODUCTS`)
- **Fulfillment** — Orders, Delivery (`ORDERS`)
- **Stock** — Inventory, Warehouses (`INVENTORY`)
- **Marketing** — Coupons (`COUPONS`)
- **Content** — Reviews (`REVIEWS`)
- **Messaging** — Notifications, WhatsApp (`NOTIFICATIONS`)
- **Access** — Users, Roles (`USERS`)
- **Insights** — Dashboard (`REPORTS`)

Hide the whole group if the user has none of its permissions.

### Route guard

```ts
// Next.js middleware / layout
if (!can(user, 'INVENTORY')) redirect('/admin'); // or 403 page
```

Protect every admin route with the same permission as the nav item. Do not check `user.role === 'MANAGER'`.

### Admin app vs storefront

The seeded **Customer** role includes `PRODUCTS`, `ORDERS`, and `REVIEWS` for the storefront. Do **not** put a customer into the admin shell just because they have `PRODUCTS`.

Treat the user as staff (show `/admin`) if:

```ts
function isStaff(user: AuthUser): boolean {
  if (user.role !== 'CUSTOMER') return true;
  return canAny(user, [
    'USERS',
    'REPORTS',
    'INVENTORY',
    'COUPONS',
    'NOTIFICATIONS',
  ]);
}
```

That way a Customer who was given extra `INVENTORY` can open Inventory, but a normal shopper stays on the storefront.

Storefront routes (`/account`, cart, checkout, “my orders”, “write a review”) stay available to any authenticated user. They are not permission-gated on the backend the same way.

---

## 4. Admin screens to build

### 4.1 Roles (`USERS` permission)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/permissions` | Catalog for checkboxes. `data` is `Permission[]` |
| GET | `/api/roles` | All roles + `userCount` |
| GET | `/api/roles/:id` | Detail |
| POST | `/api/roles` | Create |
| PATCH | `/api/roles/:id` | Update |
| DELETE | `/api/roles/:id` | Custom roles only |

**List UI:** name, slug, system badge, permission chips, user count, actions.

**Create / edit form:**

```ts
// POST /api/roles
{
  name: string;            // required, 2–80
  slug?: string;           // optional; kebab-case; generated from name if omitted
  description?: string;
  permissions: Permission[]; // required array, can be empty
}

// PATCH /api/roles/:id  (all fields optional)
{
  name?: string;
  slug?: string;
  description?: string | null;
  permissions?: Permission[];
}
```

Load checkboxes from `GET /api/permissions`. Do not invent permission strings.

UI rules:

- If `isSystem === true`: disable delete. Disable slug editing. Show “System role”.
- If `slug === 'ADMIN'`: keep every permission checked; backend rejects shrinking Admin.
- If `userCount > 0`: disable delete (or confirm that they must reassign users first). Backend also rejects this.
- After saving a role, anyone with that role picks up new permissions on their **next API request** (no re-login). Still refresh `GET /api/auth/me` for the current user if they edited their own role.

### 4.2 Users (`USERS` permission)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/users` | Paginated list |
| GET | `/api/users/:id` | Detail |
| POST | `/api/users` | Create staff / customer |
| PATCH | `/api/users/:id` | Update profile, role, extras |
| PUT | `/api/users/:id/extra-permissions` | Replace extra grants only |
| DELETE | `/api/users/:id` | Soft delete |
| POST | `/api/users/:id/restore` | Restore |

**List query:**

```
GET /api/users?page=1&limit=20&search=jane&roleId=<uuid>&role=SALES&status=ACTIVE
```

`role` is the slug; `roleId` is the UUID. Either filter is fine.

**Create:**

```ts
{
  firstName: string;
  lastName: string;
  email: string;
  password: string;          // min 8
  phone?: string;
  avatar?: string;           // URL
  roleId?: string;           // UUID from GET /api/roles; defaults to Customer
  status?: UserStatus;       // default ACTIVE
  extraPermissions?: Permission[];
}
```

Role dropdown = `GET /api/roles` (`id` as value, `name` as label). Do not send `role: "SALES"`.

**Update (PATCH):** same fields optional, including `roleId`, `password`, `extraPermissions`. Sending `extraPermissions` **replaces** the extra set.

**Extra permissions (recommended dedicated control):**

```ts
PUT /api/users/:id/extra-permissions
{ "permissions": ["INVENTORY", "COUPONS"] }
```

`[]` clears extras. Role permissions are unchanged.

**User detail UI (important):**

Show three lists so admins understand the model:

1. **Role permissions** — read-only chips from `rolePermissions` (edit via Roles screen)
2. **Extra permissions** — editable checkboxes; options = catalog minus already-in-role (or show all, with role ones disabled/checked)
3. **Effective** — `permissions` (what the API actually enforces)

Suggested copy: “Extra permissions are added on top of the role. Changing the role does not remove extras.”

**Safety:**

- Last remaining Admin cannot be demoted or deleted (400). Disable those actions when `role === 'ADMIN'` and you know they are the last one, or just show the API `message`.
- Soft-deleted users: list with `status=INACTIVE` is not the same as deleted. Restore is `POST /api/users/:id/restore`.

---

## 5. Permission labels for the UI

The API returns raw enum values. Map them for humans:

```ts
const PERMISSION_LABEL: Record<Permission, string> = {
  PRODUCTS: 'Catalog (products, categories, brands)',
  ORDERS: 'Orders & delivery methods',
  USERS: 'Users & roles',
  REPORTS: 'Dashboard',
  COUPONS: 'Coupons',
  REVIEWS: 'Review moderation',
  INVENTORY: 'Inventory & warehouses',
  NOTIFICATIONS: 'Notifications & WhatsApp',
};
```

---

## 6. Screen flow

```
Login
  → GET /auth/me (or use login payload)
  → if !isStaff → storefront
  → if isStaff → /admin
       sidebar = visibleNav(user)

/admin/roles
  GET /permissions + GET /roles
  create/edit checkboxes from catalog
  delete only if !isSystem && userCount === 0

/admin/users
  GET /users + GET /roles (for filter + assign)
  create: roleId + optional extraPermissions
  edit: PATCH roleId, PUT extra-permissions
```

---

## 7. Error handling

| Status | When | UI |
|--------|------|-----|
| 400 | Last admin, system role delete, Admin permissions stripped, slug in use | Toast `message` |
| 401 | Missing/expired token | Refresh, then login |
| 403 | No `USERS` (or other) permission | Hide module; 403 page if they navigate anyway |
| 404 | Unknown id | “Not found” |
| 409 | Email or role slug already used | Field error |

---

## 8. What not to do

- Do not gate admin pages on `role === 'ADMIN' \|\| role === 'MANAGER'`. Custom roles would disappear from the UI.
- Do not send `role: 'SALES'` on create/update. Send `roleId`.
- Do not let admins type free-text permissions. Use `GET /api/permissions`.
- Do not assume JWT `role` is enough for nav. Use `user.permissions`.
- Do not add a “create permission” screen. Permissions are a fixed backend catalog.
- Public catalog GETs (`GET /api/products`, brands, categories) stay public. Permission only applies to **write / admin** routes.

---

## 9. Seeded accounts (local)

| Email | Password | Role slug | Typical modules |
|-------|----------|-----------|-----------------|
| `admin@example.com` | `Admin123!` | `ADMIN` | All |
| `manager@example.com` | `Manager123!` | `MANAGER` | All except Users/Roles |
| `sales@example.com` | `Sales123!` | `SALES` | Catalog, Orders, Dashboard, Coupons, Inventory |
| `customer@example.com` | `Customer123!` | `CUSTOMER` | Storefront only |
