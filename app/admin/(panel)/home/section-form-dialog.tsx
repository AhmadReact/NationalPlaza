"use client";

import { useMemo, useState } from "react";
import type { CategoryTreeNode } from "@/app/admin/(panel)/categories/store/categoryAPI";
import type { CreateHomeSectionInput } from "@/app/admin/(panel)/home/store/homeSectionAPI";
import type { HomeSection, HomeSectionType } from "@/lib/home";
import { HOME_SECTION_TYPE_LABEL, homeSectionStorefrontWarning } from "@/lib/home";

type ParentOption = {
  id: string;
  label: string;
};

export type HomeSectionFormSubmitPayload = CreateHomeSectionInput;

function flattenCategories(
  nodes: CategoryTreeNode[],
  depth = 0,
): ParentOption[] {
  const options: ParentOption[] = [];
  for (const node of nodes) {
    const prefix = depth > 0 ? `${"— ".repeat(depth)}` : "";
    options.push({ id: node.id, label: `${prefix}${node.name}` });
    options.push(...flattenCategories(node.children ?? [], depth + 1));
  }
  return options;
}

export function HomeSectionFormDialog({
  mode,
  section,
  tree,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  section: HomeSection | null;
  tree: CategoryTreeNode[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: HomeSectionFormSubmitPayload) => void;
}) {
  const [title, setTitle] = useState(section?.title ?? "");
  const [type, setType] = useState<HomeSectionType>(
    section?.type ?? "CATEGORY_PRODUCTS",
  );
  const [categoryId, setCategoryId] = useState(section?.categoryId ?? "");
  const [productLimit, setProductLimit] = useState(
    String(section?.productLimit ?? 4),
  );
  const [isActive, setIsActive] = useState(section?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(section?.sortOrder ?? 0));
  const [formError, setFormError] = useState<string | null>(null);

  const categoryOptions = useMemo(() => flattenCategories(tree), [tree]);
  const previewWarning = homeSectionStorefrontWarning({
    id: section?.id ?? "preview",
    title: title.trim() || null,
    type,
    categoryId: type === "CATEGORY_PRODUCTS" ? categoryId || null : null,
    category:
      type === "CATEGORY_PRODUCTS"
        ? section?.categoryId === categoryId
          ? section.category
          : categoryId
            ? {
                id: categoryId,
                name:
                  categoryOptions.find((option) => option.id === categoryId)
                    ?.label ?? "Category",
                slug: "",
                isActive: true,
              }
            : null
        : null,
    productLimit: Number(productLimit) || 4,
    isActive,
    sortOrder: Number(sortOrder) || 0,
    createdAt: section?.createdAt ?? "",
    updatedAt: section?.updatedAt ?? "",
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (type === "CATEGORY_PRODUCTS" && !categoryId.trim()) {
      setFormError("Choose a category for this product row.");
      return;
    }

    const limit = Number(productLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 12) {
      setFormError("Product limit must be an integer from 1 to 12.");
      return;
    }

    const order = Number(sortOrder);
    if (!Number.isInteger(order) || order < 0) {
      setFormError("Sort order must be an integer of 0 or more.");
      return;
    }

    const payload: HomeSectionFormSubmitPayload = {
      title: title.trim() || null,
      type,
      productLimit: limit,
      isActive,
      sortOrder: order,
      categoryId:
        type === "CATEGORY_PRODUCTS"
          ? categoryId.trim()
          : mode === "edit"
            ? null
            : undefined,
    };

    onSubmit(payload);
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
        aria-labelledby="home-section-dialog-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2
            id="home-section-dialog-title"
            className="font-display text-lg font-bold text-brand-950"
          >
            {mode === "create" ? "Add homepage section" : "Edit homepage section"}
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

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Type *
            </span>
            <select
              value={type}
              onChange={(e) => {
                const next = e.target.value as HomeSectionType;
                setType(next);
                if (next === "FEATURED_PRODUCTS") setCategoryId("");
              }}
              className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
            >
              {(Object.keys(HOME_SECTION_TYPE_LABEL) as HomeSectionType[]).map(
                (key) => (
                  <option key={key} value={key}>
                    {HOME_SECTION_TYPE_LABEL[key]}
                  </option>
                ),
              )}
            </select>
          </label>

          {type === "CATEGORY_PRODUCTS" ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category *
              </span>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
              >
                <option value="">Select a category</option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Featured rows use products marked as featured. No category is required.
            </p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
              placeholder={
                type === "FEATURED_PRODUCTS" ? "Featured" : "Category name on the storefront"
              }
            />
            <span className="mt-1 block text-xs text-slate-400">
              Optional. Defaults to the category name or “Featured” on the storefront.
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product limit
              </span>
              <input
                type="number"
                min={1}
                max={12}
                step={1}
                value={productLimit}
                onChange={(e) => setProductLimit(e.target.value)}
                className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
              />
              <span className="mt-1 block text-xs text-slate-400">
                1–12 products. Default 4.
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sort order
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 rounded-xl border-2 border-brand-900/10 px-4 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            Active
          </label>

          {previewWarning ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {previewWarning}
            </p>
          ) : null}

          {formError || error ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError || error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
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
                  ? "Create section"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
