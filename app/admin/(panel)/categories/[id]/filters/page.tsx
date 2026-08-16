"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  StatusPill,
} from "@/components/admin/ui";
import { SortableList } from "@/components/admin/sortable-list";
import {
  useCreateAttributeOptionMutation,
  useCreateCategoryAttributeMutation,
  useDeleteAttributeOptionMutation,
  useDeleteCategoryAttributeMutation,
  useGetCategoryAttributesQuery,
  useGetCategoryByIdQuery,
  useReorderAttributeOptionsMutation,
  useReorderCategoryAttributesMutation,
  useUpdateAttributeOptionMutation,
  useUpdateCategoryAttributeMutation,
  type CategoryAttribute,
  type CategoryAttributeOption,
} from "@/app/admin/(panel)/categories/store/categoryAPI";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import type { AttributeInputType } from "@/lib/catalog-query";
import {
  getCategoryFilterSeed,
  MAX_ATTRIBUTES_PER_CATEGORY,
  MAX_OPTIONS_PER_ATTRIBUTE,
} from "@/lib/category-filter-seeds";
import { useAppDispatch } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";

type AttributeFormState = {
  name: string;
  inputType: AttributeInputType;
  isFilterable: boolean;
  isRequired: boolean;
  optionsText: string;
};

const emptyAttributeForm: AttributeFormState = {
  name: "",
  inputType: "SELECT",
  isFilterable: true,
  isRequired: false,
  optionsText: "",
};

function rtkError(error: unknown, fallback: string): string {
  return getFetchErrorMessage(
    error as { status?: number | string; data?: unknown; error?: string },
    fallback,
  );
}

function sortedAttributes(items: CategoryAttribute[]): CategoryAttribute[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function sortedOptions(
  items: CategoryAttributeOption[] | undefined,
): CategoryAttributeOption[] {
  return [...(items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
}

function optionSlug(option: CategoryAttributeOption): string {
  return option.slug || option.value || "";
}

export default function AdminCategoryFiltersPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id;
  const dispatch = useAppDispatch();

  const { data: categoryResult, isLoading: categoryLoading } =
    useGetCategoryByIdQuery(categoryId);
  const {
    data: attributesResult,
    isLoading: attributesLoading,
    isError,
    error,
    refetch,
  } = useGetCategoryAttributesQuery(categoryId);

  const [createAttribute, { isLoading: isCreating }] =
    useCreateCategoryAttributeMutation();
  const [updateAttribute, { isLoading: isUpdating }] =
    useUpdateCategoryAttributeMutation();
  const [deleteAttribute, { isLoading: isDeleting }] =
    useDeleteCategoryAttributeMutation();
  const [reorderAttributes, { isLoading: isReordering }] =
    useReorderCategoryAttributesMutation();
  const [createOption, { isLoading: isCreatingOption }] =
    useCreateAttributeOptionMutation();
  const [updateOption, { isLoading: isUpdatingOption }] =
    useUpdateAttributeOptionMutation();
  const [deleteOption, { isLoading: isDeletingOption }] =
    useDeleteAttributeOptionMutation();
  const [reorderOptions, { isLoading: isReorderingOptions }] =
    useReorderAttributeOptionsMutation();

  const [form, setForm] = useState<AttributeFormState>(emptyAttributeForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({});
  const [newOptionByAttribute, setNewOptionByAttribute] = useState<
    Record<string, string>
  >({});
  const [deleteTarget, setDeleteTarget] = useState<CategoryAttribute | null>(
    null,
  );
  const [seeding, setSeeding] = useState(false);

  const category = categoryResult?.data;
  const attributes = useMemo(
    () => sortedAttributes(attributesResult?.data ?? []),
    [attributesResult?.data],
  );
  const seed = getCategoryFilterSeed(category?.slug);
  const isSaving =
    isCreating ||
    isUpdating ||
    isDeleting ||
    isReordering ||
    isCreatingOption ||
    isUpdatingOption ||
    isDeletingOption ||
    isReorderingOptions ||
    seeding;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const name = form.name.trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (attributes.length >= MAX_ATTRIBUTES_PER_CATEGORY) {
      setFormError(`A category can have at most ${MAX_ATTRIBUTES_PER_CATEGORY} attributes.`);
      return;
    }

    const options = form.optionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label) => ({ label }));

    if (
      (form.inputType === "SELECT" || form.inputType === "MULTI_SELECT") &&
      options.length === 0
    ) {
      setFormError("Add at least one option (one label per line).");
      return;
    }
    if (options.length > MAX_OPTIONS_PER_ATTRIBUTE) {
      setFormError(`An attribute can have at most ${MAX_OPTIONS_PER_ATTRIBUTE} options.`);
      return;
    }

    try {
      const result = await createAttribute({
        categoryId,
        name,
        inputType: form.inputType,
        isFilterable: form.isFilterable,
        isRequired: form.isRequired,
        options: options.length > 0 ? options : undefined,
      }).unwrap();
      dispatch(toast.success(result.message || "Filter attribute created."));
      setForm(emptyAttributeForm);
    } catch (err) {
      setFormError(rtkError(err, "Failed to create attribute."));
    }
  }

  async function handleReorder(nextItems: CategoryAttribute[]) {
    try {
      await reorderAttributes({
        categoryId,
        items: nextItems.map((item, index) => ({
          id: item.id,
          sortOrder: index,
        })),
      }).unwrap();
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to reorder attributes.")));
    }
  }

  async function handleReorderOptions(
    attribute: CategoryAttribute,
    nextItems: CategoryAttributeOption[],
  ) {
    try {
      await reorderOptions({
        categoryId,
        attributeId: attribute.id,
        items: nextItems.map((item, index) => ({
          id: item.id,
          sortOrder: index,
        })),
      }).unwrap();
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to reorder options.")));
    }
  }

  async function handleToggle(
    attribute: CategoryAttribute,
    field: "isFilterable" | "isRequired",
  ) {
    try {
      const result = await updateAttribute({
        categoryId,
        attributeId: attribute.id,
        [field]: !attribute[field],
      }).unwrap();
      dispatch(toast.success(result.message || "Attribute updated."));
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to update attribute.")));
    }
  }

  async function handleAddOption(attribute: CategoryAttribute) {
    const label = (newOptionByAttribute[attribute.id] ?? "").trim();
    if (!label) return;
    if (sortedOptions(attribute.options).length >= MAX_OPTIONS_PER_ATTRIBUTE) {
      dispatch(
        toast.error(
          `An attribute can have at most ${MAX_OPTIONS_PER_ATTRIBUTE} options.`,
        ),
      );
      return;
    }
    try {
      const result = await createOption({
        categoryId,
        attributeId: attribute.id,
        label,
      }).unwrap();
      dispatch(toast.success(result.message || "Option added."));
      setNewOptionByAttribute((prev) => ({ ...prev, [attribute.id]: "" }));
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to add option.")));
    }
  }

  async function handleSaveOption(
    attribute: CategoryAttribute,
    option: CategoryAttributeOption,
  ) {
    const label = (optionDrafts[option.id] ?? option.label).trim();
    if (!label || label === option.label) return;
    try {
      const result = await updateOption({
        categoryId,
        attributeId: attribute.id,
        optionId: option.id,
        label,
      }).unwrap();
      dispatch(toast.success(result.message || "Option updated."));
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to update option.")));
    }
  }

  async function handleDeleteOption(
    attribute: CategoryAttribute,
    option: CategoryAttributeOption,
  ) {
    try {
      const result = await deleteOption({
        categoryId,
        attributeId: attribute.id,
        optionId: option.id,
      }).unwrap();
      dispatch(toast.success(result.message || "Option deleted."));
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to delete option.")));
    }
  }

  async function handleDeleteAttribute() {
    if (!deleteTarget) return;
    try {
      const result = await deleteAttribute({
        categoryId,
        attributeId: deleteTarget.id,
      }).unwrap();
      dispatch(toast.success(result.message || "Attribute deleted."));
      setDeleteTarget(null);
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to delete attribute.")));
    }
  }

  async function handleSeed() {
    if (!seed) return;
    setSeeding(true);
    try {
      for (const item of seed) {
        await createAttribute({
          categoryId,
          name: item.name,
          inputType: item.inputType,
          isFilterable: item.isFilterable,
          isRequired: item.isRequired,
          options: item.options,
        }).unwrap();
      }
      dispatch(toast.success("Seeded category filter attributes."));
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to seed attributes.")));
    } finally {
      setSeeding(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title={category ? `${category.name} filters` : "Category filters"}
        description="These attributes power the storefront sidebar. Product specifications stay on the product page and are not used as shop filters."
        action={
          <Link
            href="/admin/categories"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-950 hover:bg-brand-50"
          >
            Back to categories
          </Link>
        }
      />

      {isError ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {rtkError(error, "Failed to load attributes.")}{" "}
          <button type="button" className="font-semibold underline" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AdminPanel
          title={`Attributes (${attributes.length}/${MAX_ATTRIBUTES_PER_CATEGORY})`}
          action={
            seed && attributes.length === 0 ? (
              <AdminPrimaryButton
                onClick={handleSeed}
                disabled={isSaving || categoryLoading}
              >
                {seeding ? "Seeding…" : "Seed defaults"}
              </AdminPrimaryButton>
            ) : null
          }
        >
          {attributesLoading || categoryLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
          ) : attributes.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No filter attributes yet. Add Capacity, Type, Size, and similar
              shop filters here — not free-text specifications.
            </p>
          ) : (
            <SortableList
              className="space-y-4"
              items={attributes}
              disabled={isSaving}
              onReorder={handleReorder}
              renderItem={(attribute) => {
                const options = sortedOptions(attribute.options);
                return (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-brand-950">
                        {attribute.name}
                      </span>
                      <StatusPill label={attribute.inputType} tone="info" />
                      <span className="font-mono text-xs text-slate-400">
                        {attribute.slug}
                      </span>
                      <div className="ml-auto flex flex-wrap gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={attribute.isFilterable}
                            disabled={isSaving}
                            onChange={() =>
                              handleToggle(attribute, "isFilterable")
                            }
                          />
                          Filterable
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={attribute.isRequired}
                            disabled={isSaving}
                            onChange={() =>
                              handleToggle(attribute, "isRequired")
                            }
                          />
                          Required
                        </label>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(attribute)}
                          className="rounded-lg border border-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {options.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          No options yet
                          {attribute.inputType === "BOOLEAN"
                            ? " — BOOLEAN filters typically use Yes/No values from the API."
                            : "."}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {options.map((option, optionIndex) => {
                            const draft =
                              optionDrafts[option.id] ?? option.label;
                            const dirty = draft.trim() !== option.label;
                            return (
                              <div
                                key={option.id}
                                className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2"
                              >
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    disabled={isSaving || optionIndex === 0}
                                    aria-label="Move option up"
                                    onClick={() => {
                                      const next = [...options];
                                      const [moved] = next.splice(
                                        optionIndex,
                                        1,
                                      );
                                      next.splice(optionIndex - 1, 0, moved);
                                      handleReorderOptions(attribute, next);
                                    }}
                                    className="px-1 text-[10px] text-slate-500 disabled:opacity-30"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      isSaving ||
                                      optionIndex === options.length - 1
                                    }
                                    aria-label="Move option down"
                                    onClick={() => {
                                      const next = [...options];
                                      const [moved] = next.splice(
                                        optionIndex,
                                        1,
                                      );
                                      next.splice(optionIndex + 1, 0, moved);
                                      handleReorderOptions(attribute, next);
                                    }}
                                    className="px-1 text-[10px] text-slate-500 disabled:opacity-30"
                                  >
                                    ▼
                                  </button>
                                </div>
                                <input
                                  value={draft}
                                  onChange={(e) =>
                                    setOptionDrafts((prev) => ({
                                      ...prev,
                                      [option.id]: e.target.value,
                                    }))
                                  }
                                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-600"
                                />
                                {optionSlug(option) ? (
                                  <span className="font-mono text-[11px] text-slate-400">
                                    {optionSlug(option)}
                                  </span>
                                ) : null}
                                <button
                                  type="button"
                                  disabled={isSaving || !dirty}
                                  onClick={() =>
                                    handleSaveOption(attribute, option)
                                  }
                                  className="rounded-lg bg-brand-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() =>
                                    handleDeleteOption(attribute, option)
                                  }
                                  className="rounded-lg border border-red-100 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {attribute.inputType !== "BOOLEAN" ||
                      options.length < 2 ? (
                        <div className="flex gap-2">
                          <input
                            value={newOptionByAttribute[attribute.id] ?? ""}
                            onChange={(e) =>
                              setNewOptionByAttribute((prev) => ({
                                ...prev,
                                [attribute.id]: e.target.value,
                              }))
                            }
                            placeholder="New option label"
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-600"
                          />
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleAddOption(attribute)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                          >
                            Add option
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              }}
            />
          )}
        </AdminPanel>

        <AdminPanel title="Add attribute">
          <form onSubmit={handleCreate} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name *
              </span>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-xl border-2 border-brand-900/10 px-3 py-2.5 text-sm outline-none focus:border-brand-600"
                placeholder="Capacity"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Input type
              </span>
              <select
                value={form.inputType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    inputType: e.target.value as AttributeInputType,
                  }))
                }
                className="w-full rounded-xl border-2 border-brand-900/10 px-3 py-2.5 text-sm outline-none focus:border-brand-600"
              >
                <option value="SELECT">SELECT (single)</option>
                <option value="MULTI_SELECT">MULTI_SELECT</option>
                <option value="BOOLEAN">BOOLEAN</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFilterable}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isFilterable: e.target.checked,
                  }))
                }
              />
              Show in shop filters
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isRequired: e.target.checked,
                  }))
                }
              />
              Required on products
            </label>
            {form.inputType !== "BOOLEAN" ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Options (one per line)
                </span>
                <textarea
                  value={form.optionsText}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      optionsText: e.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full rounded-xl border-2 border-brand-900/10 px-3 py-2.5 text-sm outline-none focus:border-brand-600"
                  placeholder={"1 Ton\n1.5 Ton\n2 Ton"}
                />
              </label>
            ) : null}
            {formError ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isCreating ? "Creating…" : "Create attribute"}
            </button>
          </form>
        </AdminPanel>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/40 p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close delete dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="font-display text-lg font-bold text-brand-950">
              Delete attribute
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete{" "}
              <span className="font-semibold">{deleteTarget.name}</span>? This
              removes it from shop filters and product forms.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-950 hover:bg-brand-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAttribute}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
