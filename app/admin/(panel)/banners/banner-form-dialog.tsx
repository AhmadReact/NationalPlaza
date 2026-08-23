"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useGetCategoryTreeQuery,
  type CategoryTreeNode,
} from "@/app/admin/(panel)/categories/store/categoryAPI";
import {
  useGetProductsQuery,
  type Product,
} from "@/app/admin/(panel)/products/store/productAPI";
import {
  BANNER_LINK_LABEL,
  BANNER_PLACEMENT_LABEL,
  type Banner,
  type BannerLinkType,
  type BannerPlacement,
  type BannerWriteInput,
} from "@/app/admin/(panel)/banners/store/bannerAPI";

type FormState = {
  title: string;
  subtitle: string;
  alt: string;
  placement: BannerPlacement;
  linkType: BannerLinkType;
  productId: string;
  productLabel: string;
  categoryId: string;
  categoryLabel: string;
  url: string;
  isActive: boolean;
  sortOrder: string;
  startsAt: string;
  endsAt: string;
  desktopFile: File | null;
  mobileFile: File | null;
  removeMobile: boolean;
};

const emptyForm: FormState = {
  title: "",
  subtitle: "",
  alt: "",
  placement: "HOME_HERO",
  linkType: "NONE",
  productId: "",
  productLabel: "",
  categoryId: "",
  categoryLabel: "",
  url: "",
  isActive: true,
  sortOrder: "0",
  startsAt: "",
  endsAt: "",
  desktopFile: null,
  mobileFile: null,
  removeMobile: false,
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const fieldClass =
  "w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500";

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isValidBannerUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("/")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 0,
): Array<{ id: string; label: string; name: string }> {
  const options: Array<{ id: string; label: string; name: string }> = [];
  for (const node of nodes) {
    options.push({
      id: node.id,
      name: node.name,
      label: `${"— ".repeat(depth)}${node.name}`,
    });
    options.push(...flattenCategoryTree(node.children ?? [], depth + 1));
  }
  return options;
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Use a JPEG, PNG, WebP, GIF, or SVG image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Images must be 5MB or smaller.";
  }
  return null;
}

function formFromBanner(banner: Banner): FormState {
  return {
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    alt: banner.alt ?? "",
    placement: banner.placement,
    linkType: banner.linkType,
    productId: banner.productId ?? "",
    productLabel: banner.product?.name ?? "",
    categoryId: banner.categoryId ?? "",
    categoryLabel: banner.category?.name ?? "",
    url: banner.url ?? "",
    isActive: banner.isActive,
    sortOrder: String(banner.sortOrder ?? 0),
    startsAt: toDatetimeLocalValue(banner.startsAt),
    endsAt: toDatetimeLocalValue(banner.endsAt),
    desktopFile: null,
    mobileFile: null,
    removeMobile: false,
  };
}

export type BannerFormSubmitPayload = {
  body: BannerWriteInput;
  desktopFile: File | null;
  mobileFile: File | null;
  removeMobile: boolean;
};

export function BannerFormDialog({
  mode,
  banner,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  banner: Banner | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: BannerFormSubmitPayload) => void;
}) {
  const [form, setForm] = useState<FormState>(
    banner ? formFromBanner(banner) : emptyForm,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productOpen, setProductOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedProductSearch(productSearch.trim()),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [productSearch]);

  const needsProduct =
    form.placement === "PRODUCT" || form.linkType === "PRODUCT";
  const needsCategory =
    form.placement === "CATEGORY" || form.linkType === "CATEGORY";
  const needsUrl = form.linkType === "URL";

  const { data: productData, isFetching: productsFetching } =
    useGetProductsQuery(
      {
        page: 1,
        limit: 15,
        search: debouncedProductSearch || undefined,
        status: "ACTIVE",
      },
      { skip: !needsProduct || (!productOpen && !debouncedProductSearch) },
    );

  const { data: treeData } = useGetCategoryTreeQuery(undefined, {
    skip: !needsCategory,
  });

  const products = productData?.data ?? [];
  const categoryOptions = useMemo(
    () => flattenCategoryTree(treeData?.data ?? []),
    [treeData],
  );
  const filteredCategories = useMemo(() => {
    const query = categoryFilter.trim().toLowerCase();
    if (!query) return categoryOptions.slice(0, 40);
    return categoryOptions
      .filter((option) => option.name.toLowerCase().includes(query))
      .slice(0, 40);
  }, [categoryFilter, categoryOptions]);

  const desktopSrc = desktopPreview ?? banner?.imageUrl ?? null;
  const mobileSrc =
    mobilePreview ?? (form.removeMobile ? null : banner?.mobileImageUrl ?? null);

  function setImageFile(field: "desktopFile" | "mobileFile", file: File | null) {
    if (file) {
      const invalid = validateImageFile(file);
      if (invalid) {
        setFormError(invalid);
        return;
      }
    }
    setFormError(null);
    setForm((prev) => ({
      ...prev,
      [field]: file,
      ...(field === "mobileFile" && file ? { removeMobile: false } : {}),
    }));
    if (field === "desktopFile") {
      setDesktopPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return file ? URL.createObjectURL(file) : null;
      });
    } else {
      setMobilePreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return file ? URL.createObjectURL(file) : null;
      });
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const title = form.title.trim();
    if (!title) {
      setFormError("Title is required.");
      return;
    }
    if (needsProduct && !form.productId) {
      setFormError("Select a product.");
      return;
    }
    if (needsCategory && !form.categoryId) {
      setFormError("Select a category.");
      return;
    }
    if (needsUrl) {
      if (!form.url.trim()) {
        setFormError("Enter a URL or site path.");
        return;
      }
      if (!isValidBannerUrl(form.url)) {
        setFormError("URL must start with https://, http://, or /.");
        return;
      }
    }

    const startsAt = fromDatetimeLocalValue(form.startsAt);
    const endsAt = fromDatetimeLocalValue(form.endsAt);
    if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
      setFormError("Start date must be before end date.");
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      setFormError("Sort order must be a number.");
      return;
    }

    const hasDesktop = Boolean(form.desktopFile || banner?.imageUrl);
    if (form.isActive && !hasDesktop) {
      setFormError("Upload a desktop image before going live.");
      return;
    }

    onSubmit({
      body: {
        title,
        subtitle: form.subtitle.trim() || null,
        alt: form.alt.trim() || null,
        placement: form.placement,
        linkType: form.linkType,
        productId: needsProduct ? form.productId : null,
        categoryId: needsCategory ? form.categoryId : null,
        url: needsUrl ? form.url.trim() : null,
        isActive: form.isActive,
        sortOrder,
        startsAt,
        endsAt,
      },
      desktopFile: form.desktopFile,
      mobileFile: form.mobileFile,
      removeMobile: form.removeMobile && !form.mobileFile,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/40 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={() => !saving && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-dialog-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2
            id="banner-dialog-title"
            className="font-display text-lg font-bold text-brand-950"
          >
            {mode === "create" ? "Add banner" : "Edit banner"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-brand-950 disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <label className="block">
              <span className={labelClass}>Title *</span>
              <input
                required
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className={fieldClass}
                placeholder="Summer AC sale"
              />
            </label>

            <label className="block">
              <span className={labelClass}>Subtitle</span>
              <input
                value={form.subtitle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subtitle: e.target.value }))
                }
                className={fieldClass}
                placeholder="Up to 25% off selected units"
              />
            </label>

            <label className="block">
              <span className={labelClass}>Alt text</span>
              <input
                value={form.alt}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, alt: e.target.value }))
                }
                className={fieldClass}
                placeholder="Falls back to title if empty"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Placement *</span>
                <select
                  value={form.placement}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      placement: e.target.value as BannerPlacement,
                    }))
                  }
                  className={fieldClass}
                >
                  {(Object.keys(BANNER_PLACEMENT_LABEL) as BannerPlacement[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {BANNER_PLACEMENT_LABEL[key]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Click target *</span>
                <select
                  value={form.linkType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      linkType: e.target.value as BannerLinkType,
                    }))
                  }
                  className={fieldClass}
                >
                  {(Object.keys(BANNER_LINK_LABEL) as BannerLinkType[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {BANNER_LINK_LABEL[key]}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            {needsProduct ? (
              <div className="relative">
                <span className={labelClass}>
                  {form.placement === "PRODUCT" && form.linkType !== "PRODUCT"
                    ? "Show on product *"
                    : "Product *"}
                </span>
                {form.productId ? (
                  <div className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-brand-950">
                      {form.productLabel || "Selected product"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          productId: "",
                          productLabel: "",
                        }))
                      }
                      className="text-xs font-semibold text-slate-500 hover:text-brand-950"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
                <input
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductOpen(true);
                  }}
                  onFocus={() => setProductOpen(true)}
                  placeholder="Search products…"
                  className={fieldClass}
                />
                {productOpen ? (
                  <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {productsFetching ? (
                      <li className="px-3 py-2 text-sm text-slate-500">
                        Searching…
                      </li>
                    ) : products.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-slate-500">
                        No products found.
                      </li>
                    ) : (
                      products.map((product: Product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                productId: product.id,
                                productLabel: product.name,
                              }));
                              setProductSearch("");
                              setProductOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                          >
                            <span className="block font-medium text-brand-950">
                              {product.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {product.slug}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {needsCategory ? (
              <div>
                <span className={labelClass}>
                  {form.placement === "CATEGORY" && form.linkType !== "CATEGORY"
                    ? "Show on category *"
                    : "Category *"}
                </span>
                {form.categoryId ? (
                  <div className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-brand-950">
                      {form.categoryLabel || "Selected category"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          categoryId: "",
                          categoryLabel: "",
                        }))
                      }
                      className="text-xs font-semibold text-slate-500 hover:text-brand-950"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
                <input
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Search categories…"
                  className={`${fieldClass} mb-2`}
                />
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                  {filteredCategories.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-500">
                      No categories found.
                    </p>
                  ) : (
                    filteredCategories.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            categoryId: option.id,
                            categoryLabel: option.name,
                          }));
                          setCategoryFilter("");
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-brand-50 ${
                          form.categoryId === option.id
                            ? "bg-brand-50 font-semibold"
                            : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {needsUrl ? (
              <label className="block">
                <span className={labelClass}>URL *</span>
                <input
                  value={form.url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                  className={fieldClass}
                  placeholder="https://example.com or /sale"
                />
              </label>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={labelClass}>Desktop image *</span>
                <div className="flex items-start gap-3">
                  {desktopSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={desktopSrc}
                      alt=""
                      className="h-16 w-24 rounded-xl border border-slate-100 object-cover"
                    />
                  ) : (
                    <span className="grid h-16 w-24 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                      Required
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={(e) =>
                      setImageFile("desktopFile", e.target.files?.[0] ?? null)
                    }
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-900 hover:file:bg-brand-100"
                  />
                </div>
              </div>
              <div>
                <span className={labelClass}>Mobile image</span>
                <div className="flex items-start gap-3">
                  {mobileSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mobileSrc}
                      alt=""
                      className="h-16 w-16 rounded-xl border border-slate-100 object-cover"
                    />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                      Optional
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      onChange={(e) =>
                        setImageFile("mobileFile", e.target.files?.[0] ?? null)
                      }
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-900 hover:file:bg-brand-100"
                    />
                    {mode === "edit" && banner?.mobileImageUrl ? (
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={form.removeMobile}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              removeMobile: e.target.checked,
                              mobileFile: e.target.checked
                                ? null
                                : prev.mobileFile,
                            }))
                          }
                          className="rounded border-slate-300"
                        />
                        Remove mobile image
                      </label>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              {form.placement === "HOME_HERO"
                ? "Hero shows the full image with no crop. Use about 1920×900 (2:1). Add a mobile image (~768×960) so text stays readable on phones."
                : "JPEG, PNG, WebP, GIF, or SVG. Max 5MB. Prefer a matching aspect ratio so the image is not cropped."}
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className={labelClass}>Sort order</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sortOrder: e.target.value }))
                  }
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Starts at</span>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startsAt: e.target.value }))
                  }
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Ends at</span>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endsAt: e.target.value }))
                  }
                  className={fieldClass}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                className="rounded border-slate-300"
              />
              Active
            </label>
            <p className="text-xs text-slate-500">
              Live on the storefront only when active, a desktop image is
              uploaded, and the schedule includes now.
            </p>

            {formError || error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError || error}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : mode === "create"
                  ? "Create banner"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
