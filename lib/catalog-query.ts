export type AttributeInputType = "SELECT" | "MULTI_SELECT" | "BOOLEAN";

export type FilterSource = "brand" | "availability" | "attribute";

export type CatalogQueryState = {
  page: number;
  brandIds: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  attrs: Record<string, string[]>;
};

export type CatalogApiParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  brandId?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  attrs?: Record<string, string | string[]>;
};

const ATTR_KEY = /^attrs\[(.+)\]$/;
const ATTR_PAIR = /^([^:=]+)[:=](.+)$/;

function parseOptionalNumber(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function splitValues(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export const COLLECTION_PAGE_SIZE = 20;

export function emptyCatalogQueryState(): CatalogQueryState {
  return {
    page: 1,
    brandIds: [],
    inStock: false,
    attrs: {},
  };
}

export type NextSearchParams = Record<string, string | string[] | undefined>;

export function nextSearchParamsToURLSearchParams(
  raw: NextSearchParams,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value == null || value === "") continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item) searchParams.append(key, item);
    }
  }
  return searchParams;
}

export function parseNextSearchParams(raw: NextSearchParams): CatalogQueryState {
  return parseCatalogSearchParams(nextSearchParamsToURLSearchParams(raw));
}

export function parseCatalogSearchParams(
  searchParams: URLSearchParams,
): CatalogQueryState {
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const brandIds = searchParams
    .getAll("brandId")
    .flatMap(splitValues);

  const attrs: Record<string, string[]> = {};
  searchParams.forEach((value, key) => {
    const match = key.match(ATTR_KEY);
    if (!match || !value) return;
    const slug = match[1];
    const next = splitValues(value);
    if (next.length === 0) return;
    attrs[slug] = [...(attrs[slug] ?? []), ...next];
  });

  for (const raw of searchParams.getAll("attrs")) {
    const pair = raw.trim().match(ATTR_PAIR);
    if (!pair) continue;
    const slug = pair[1].trim();
    const next = splitValues(pair[2]);
    if (!slug || next.length === 0) continue;
    attrs[slug] = [...(attrs[slug] ?? []), ...next];
  }

  return {
    page,
    brandIds,
    minPrice: parseOptionalNumber(searchParams.get("minPrice")),
    maxPrice: parseOptionalNumber(searchParams.get("maxPrice")),
    inStock: searchParams.get("inStock") === "true",
    attrs,
  };
}

export function catalogStateToSearchParams(
  state: CatalogQueryState,
): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (state.page > 1) searchParams.set("page", String(state.page));
  for (const id of state.brandIds) {
    searchParams.append("brandId", id);
  }
  if (state.minPrice != null) searchParams.set("minPrice", String(state.minPrice));
  if (state.maxPrice != null) searchParams.set("maxPrice", String(state.maxPrice));
  if (state.inStock) searchParams.set("inStock", "true");

  for (const [slug, values] of Object.entries(state.attrs)) {
    for (const value of values) {
      if (value) searchParams.append(`attrs[${slug}]`, value);
    }
  }

  return searchParams;
}

export function catalogStatesEqual(
  a: CatalogQueryState | null | undefined,
  b: CatalogQueryState | null | undefined,
): boolean {
  if (!a || !b) return a === b;
  return catalogStateToSearchParams(a).toString() === catalogStateToSearchParams(b).toString();
}

export function toCatalogQueryString(params: CatalogApiParams): string {
  const searchParams = new URLSearchParams();

  const setIfPresent = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  };

  setIfPresent("page", params.page);
  setIfPresent("limit", params.limit);
  setIfPresent("search", params.search);
  setIfPresent("status", params.status);
  setIfPresent("categoryId", params.categoryId);
  setIfPresent("minPrice", params.minPrice);
  setIfPresent("maxPrice", params.maxPrice);

  if (params.inStock === true) {
    searchParams.set("inStock", "true");
  }
  if (params.isFeatured !== undefined) {
    searchParams.set("isFeatured", String(params.isFeatured));
  }

  const brandIds = Array.isArray(params.brandId)
    ? params.brandId
    : params.brandId
      ? [params.brandId]
      : [];
  for (const id of brandIds) {
    if (id) searchParams.append("brandId", id);
  }

  for (const [slug, raw] of Object.entries(params.attrs ?? {})) {
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      if (!value) continue;
      // NestJS DTO accepts `attrs`, not `attrs[slug]`. Repeat for AND/OR.
      searchParams.append("attrs", `${slug}:${value}`);
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function catalogStateToApiParams(
  state: CatalogQueryState,
  extra: {
    categoryId?: string;
    status?: string;
    limit?: number;
    search?: string;
  } = {},
): CatalogApiParams {
  return {
    page: state.page,
    limit: extra.limit,
    search: extra.search,
    status: extra.status,
    categoryId: extra.categoryId,
    brandId: state.brandIds.length > 0 ? state.brandIds : undefined,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStock: state.inStock || undefined,
    attrs: Object.keys(state.attrs).length > 0 ? state.attrs : undefined,
  };
}

export function hasActiveCatalogFilters(state: CatalogQueryState): boolean {
  return (
    state.brandIds.length > 0 ||
    state.inStock ||
    state.minPrice != null ||
    state.maxPrice != null ||
    Object.values(state.attrs).some((values) => values.length > 0)
  );
}
