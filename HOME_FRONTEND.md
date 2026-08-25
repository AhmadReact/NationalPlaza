# Frontend guide: homepage categories and product rows

The storefront home page is merchandised from the API. **Do not hardcode category cards or product rows.** Hero banners stay on the banners API.

- Base URL: `{API_HOST}/api`
- Storefront home is **public** (no auth)
- Admin endpoints require `Authorization: Bearer <access_token>` and permission **`PRODUCTS`**
- Envelope (all endpoints):

```ts
{
  success: boolean;
  message: string;
  data: T | null;
  errors: Array<{ field?: string; message: string; code?: string }> | null;
  meta: null
}
```

---

## 1. Concepts

| Block on the home page | Source |
| --- | --- |
| Hero slider | `GET /api/banners?placement=HOME_HERO` (existing) |
| Mid-page promo tiles | `GET /api/banners?placement=HOME_PROMO` (existing) |
| Shop by Category grid | `data.categories` from `GET /api/home` |
| Product rows (e.g. “Geysers”) | `data.sections` from `GET /api/home` |
| Brand bar | `GET /api/brands?status=ACTIVE` (existing) |
| Search | `GET /api/products?search=…&status=ACTIVE` (existing) |

**Shop by Category** uses categories with `showOnHome: true`. Admins toggle this on the category form (`showOnHome`, `homeSortOrder`).

**Product rows** are `HomeSection` records:

| `type` | What it shows | `categoryId` | View-all `href` |
| --- | --- | --- | --- |
| `CATEGORY_PRODUCTS` | Active products in that category **and its descendants** | required | `/categories/{slug}` |
| `FEATURED_PRODUCTS` | Products with `isFeatured: true` | omitted | `/products?isFeatured=true` |

Inactive sections, inactive/deleted categories, and rows with zero products are already omitted from the storefront payload.

If your app uses different routes (for example `/shop/[slug]`), ignore `href` and build the path from `slug`.

---

## 2. Types

```ts
type HomeSectionType = 'CATEGORY_PRODUCTS' | 'FEATURED_PRODUCTS';

type HomeLinkTarget = {
  id: string;
  name: string;
  slug: string;
};

type HomeCategoryCard = {
  id: string;
  name: string;
  slug: string;
  image: string | null; // icon / thumbnail URL
  href: string;         // /categories/{slug}
};

type HomeProductCard = {
  id: string;
  name: string;
  slug: string;
  brand: HomeLinkTarget;
  category: HomeLinkTarget;
  price: number;
  salePrice: number | null;
  onSale: boolean;
  thumbnailUrl: string | null;
  thumbnailAlt: string | null;
  averageRating: number; // 0 when no reviews
  reviewCount: number;
  stock: number;
  href: string; // /products/{slug}
};

type HomeStorefrontSection = {
  id: string;
  title: string; // heading to render (“Geysers”)
  type: HomeSectionType;
  href: string | null;
  products: HomeProductCard[];
};

type HomePage = {
  categories: HomeCategoryCard[];
  sections: HomeStorefrontSection[];
};

type HomeSection = {
  id: string;
  title: string | null;
  type: HomeSectionType;
  categoryId: string | null;
  category: (HomeLinkTarget & { isActive: boolean }) | null;
  productLimit: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
```

---

## 3. Storefront

### Home page (required)

```http
GET /api/home
GET /api/banners?placement=HOME_HERO
```

Call them in parallel. Do **not** rebuild category grids or product carousels from hardcoded arrays.

```ts
const [{ data: home }, { data: heroes }] = await Promise.all([
  api.get('/home'),
  api.get('/banners', { params: { placement: 'HOME_HERO' } }),
]);
```

Optional extra calls (unchanged):

```http
GET /api/banners?placement=HOME_PROMO
GET /api/brands?status=ACTIVE&limit=50
```

### Render rules — Shop by Category

1. Use `home.categories` in the given order. Do not re-sort.
2. Card title = `name`. Icon = `image`. Hide the icon slot when `image` is null.
3. Link the card (and “View products”) to `href` (or `/categories/{slug}`).
4. Hide the whole block when `categories` is `[]`.

### Render rules — Product rows

1. One row per `home.sections` item, in the given order.
2. Heading = `section.title`. “View all” uses `section.href`.
3. Product card:
   - Image: `thumbnailUrl` (alt = `thumbnailAlt ?? name`)
   - Brand label: `brand.name`
   - Title: `name`, link to `href`
   - Stars: `averageRating` / `reviewCount` (hide stars when `reviewCount === 0` if you prefer)
   - Price: show `salePrice` when `onSale`, otherwise `price`. Strike through `price` when on sale.
   - Sale badge: `onSale === true`
   - Add to cart: disable when `stock <= 0`
4. The API already drops empty rows. If `sections` is `[]`, hide the product-row area.

### Footer “Popular categories”

Reuse `home.categories`, or `GET /api/categories/tree` if the footer needs the full tree.

### Cache

Short TTL (30–60s) or revalidate on focus. Admins expect new flags/sections to show without a redeploy.

---

## 4. Admin CMS

Gate **Homepage** (and category home flags) on `user.permissions.includes('PRODUCTS')`. Handle 403 on the page as well.

Category picker: reuse `GET /api/categories`.

### Category form (existing `POST/PATCH /api/categories`)

Add two fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `showOnHome` | boolean | Include in Shop by Category |
| `homeSortOrder` | int ≥ 0 | Order in that grid (lower first) |

List/filter:

```http
GET /api/categories?showOnHome=true&isActive=true&limit=50
```

### Homepage sections

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/home/sections` | All sections (`?type=&isActive=`) |
| `GET` | `/api/home/sections/:id` | One section |
| `POST` | `/api/home/sections` | Create |
| `PATCH` | `/api/home/sections/:id` | Update |
| `PATCH` | `/api/home/sections/reorder` | `{ items: [{ id, sortOrder }] }` |
| `DELETE` | `/api/home/sections/:id` | Delete |

Create body:

```json
{
  "title": "Geysers",
  "type": "CATEGORY_PRODUCTS",
  "categoryId": "22222222-2222-2222-2222-222222222222",
  "productLimit": 4,
  "isActive": true,
  "sortOrder": 0
}
```

Featured row:

```json
{
  "type": "FEATURED_PRODUCTS",
  "title": "Featured",
  "productLimit": 8,
  "isActive": true,
  "sortOrder": 1
}
```

### Form behaviour

1. **Type**
   - `CATEGORY_PRODUCTS` → require category picker. Optional title (defaults to category name on the storefront).
   - `FEATURED_PRODUCTS` → no category picker. Optional title (defaults to “Featured”).
2. `productLimit` 1–12, default 4.
3. `isActive` toggle and `sortOrder`.
4. If `category` is null or `isActive` is false on a category section, show a warning: it will not appear on the storefront.

Drag-and-drop order:

```ts
await api.patch('/home/sections/reorder', {
  items: ordered.map((section, index) => ({
    id: section.id,
    sortOrder: index,
  })),
});
```

Suggested admin list columns: title, type, category, product limit, active, sort, actions.

### Validation the API will reject (400 / 404)

- `type = CATEGORY_PRODUCTS` without `categoryId`
- Unknown `categoryId` → 404
- `productLimit` outside 1–12
- Duplicate ids in reorder payload

Admin list still returns inactive sections so editors can fix them.

---

## 5. Permissions and errors

| Status | Meaning |
| --- | --- |
| 400 | Validation (missing category, bad limit, duplicate reorder ids) |
| 401 | Missing / expired access token (admin only) |
| 403 | Authenticated but no `PRODUCTS` permission |
| 404 | Section / category not found |

Storefront `GET /api/home` should not toast on empty `categories` / `sections` — just hide those blocks.

---

## 6. Minimal page checklist

**Admin**

- [ ] Category form: `showOnHome` + `homeSortOrder`
- [ ] Homepage sections list with type / active filters
- [ ] Create / edit form with type + category picker
- [ ] Reorder
- [ ] Active toggle

**Storefront home**

- [ ] Remove hardcoded category cards and product rows
- [ ] Shop by Category ← `GET /api/home` → `categories`
- [ ] Product rows ← `GET /api/home` → `sections`
- [ ] Hero still ← `GET /api/banners?placement=HOME_HERO`
- [ ] Sale badge from `onSale`; price from `salePrice ?? price`
- [ ] Hide empty blocks
- [ ] Add to cart disabled when `stock <= 0`
