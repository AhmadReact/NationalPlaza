"use client";

import { useMemo, useState } from "react";
import { useGetCategoryTreeQuery } from "@/app/admin/(panel)/categories/store/categoryAPI";
import {
  HomeSectionFormDialog,
  type HomeSectionFormSubmitPayload,
} from "@/app/admin/(panel)/home/section-form-dialog";
import {
  useCreateHomeSectionMutation,
  useDeleteHomeSectionMutation,
  useGetHomeSectionsQuery,
  useReorderHomeSectionsMutation,
  useUpdateHomeSectionMutation,
} from "@/app/admin/(panel)/home/store/homeSectionAPI";
import { AdminForbidden } from "@/components/admin/forbidden";
import { SortableList } from "@/components/admin/sortable-list";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  StatusPill,
} from "@/components/admin/ui";
import type { HomeSection, HomeSectionType } from "@/lib/home";
import { HOME_SECTION_TYPE_LABEL, homeSectionStorefrontWarning } from "@/lib/home";
import { useAppDispatch } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (
      error as {
        data?: {
          message?: string;
          errors?: Array<{ field?: string; message?: string }>;
        };
      }
    ).data;
    const fieldErrors = data?.errors;
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      const parts = fieldErrors
        .map((item) =>
          item.field
            ? `${item.field}: ${item.message ?? ""}`
            : (item.message ?? ""),
        )
        .filter(Boolean);
      if (parts.length) return parts.join(" · ");
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }
  if (error && typeof error === "object" && "status" in error) {
    return `Request failed (${String((error as { status?: unknown }).status)})`;
  }
  return fallback;
}

function errorStatus(error: unknown): number | string | undefined {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status?: number | string }).status;
  }
  return undefined;
}

export default function AdminHomeSectionsPage() {
  const dispatch = useAppDispatch();
  const [typeFilter, setTypeFilter] = useState<HomeSectionType | "">("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HomeSection | null>(null);
  const [draftOrder, setDraftOrder] = useState<{
    key: string;
    items: HomeSection[];
  } | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetHomeSectionsQuery({
      type: typeFilter || undefined,
      isActive:
        activeFilter === "true"
          ? true
          : activeFilter === "false"
            ? false
            : undefined,
    });
  const { data: treeData } = useGetCategoryTreeQuery();

  const [createSection, { isLoading: isCreating }] =
    useCreateHomeSectionMutation();
  const [updateSection, { isLoading: isUpdating }] =
    useUpdateHomeSectionMutation();
  const [reorderSections, { isLoading: isReordering }] =
    useReorderHomeSectionsMutation();
  const [deleteSection, { isLoading: isDeleting }] =
    useDeleteHomeSectionMutation();

  const apiSections = useMemo(() => {
    const items = [...(data?.data ?? [])];
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return items;
  }, [data]);

  const apiKey = apiSections
    .map((section) => `${section.id}:${section.sortOrder}`)
    .join("|");
  const sections =
    draftOrder && draftOrder.key === apiKey ? draftOrder.items : apiSections;
  const saving = isCreating || isUpdating;
  const status = errorStatus(error);
  const listError = isError
    ? getErrorMessage(error, "Failed to load homepage sections.")
    : null;

  if (status === 403) {
    return <AdminForbidden permission="PRODUCTS" />;
  }

  function openCreate() {
    setDialogMode("create");
    setEditingSection(null);
    setFormError(null);
  }

  function openEdit(section: HomeSection) {
    setDialogMode("edit");
    setEditingSection(section);
    setFormError(null);
  }

  function closeDialog(force = false) {
    if (saving && !force) return;
    setDialogMode(null);
    setEditingSection(null);
    setFormError(null);
  }

  async function handleSubmit(payload: HomeSectionFormSubmitPayload) {
    setFormError(null);
    try {
      if (dialogMode === "create") {
        const created = await createSection(payload).unwrap();
        dispatch(toast.success(created.message || "Homepage section created"));
      } else if (dialogMode === "edit" && editingSection) {
        const updated = await updateSection({
          id: editingSection.id,
          ...payload,
        }).unwrap();
        dispatch(toast.success(updated.message || "Homepage section updated"));
      }
      closeDialog(true);
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          dialogMode === "create"
            ? "Failed to create homepage section."
            : "Failed to update homepage section.",
        ),
      );
    }
  }

  async function handleReorder(nextItems: HomeSection[]) {
    setDraftOrder({ key: apiKey, items: nextItems });
    try {
      await reorderSections({
        items: nextItems.map((section, index) => ({
          id: section.id,
          sortOrder: index,
        })),
      }).unwrap();
      dispatch(toast.success("Homepage section order updated"));
    } catch (err) {
      setDraftOrder(null);
      dispatch(
        toast.error(getErrorMessage(err, "Failed to reorder homepage sections.")),
      );
    }
  }

  async function handleToggleActive(section: HomeSection) {
    try {
      const result = await updateSection({
        id: section.id,
        isActive: !section.isActive,
      }).unwrap();
      dispatch(
        toast.success(
          result.message ||
            (section.isActive ? "Section deactivated" : "Section activated"),
        ),
      );
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to update section status.")),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteSection(deleteTarget.id).unwrap();
      dispatch(toast.success(result.message || "Homepage section deleted"));
      setDeleteTarget(null);
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to delete homepage section.")),
      );
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Homepage"
        description="Merchandising rows and featured products on the storefront home page."
        action={
          <AdminPrimaryButton onClick={openCreate}>
            Add section
          </AdminPrimaryButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as HomeSectionType | "")
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All types</option>
            {(Object.keys(HOME_SECTION_TYPE_LABEL) as HomeSectionType[]).map(
              (key) => (
                <option key={key} value={key}>
                  {HOME_SECTION_TYPE_LABEL[key]}
                </option>
              ),
            )}
          </select>
          <select
            value={activeFilter}
            onChange={(e) =>
              setActiveFilter(e.target.value as "" | "true" | "false")
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-50 disabled:opacity-60"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <AdminPanel
        title={`${sections.length} section${sections.length === 1 ? "" : "s"}`}
      >
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading homepage sections…
          </p>
        ) : null}

        {!isLoading && listError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-red-700">{listError}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 text-sm font-semibold text-brand-800 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !listError && sections.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No homepage sections yet. Add a category or featured row to get started.
          </p>
        ) : null}

        {!isLoading && !listError && sections.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Drag to change the order on the storefront. Inactive rows stay in
              this list so you can fix them.
            </p>
            <SortableList
              items={sections}
              disabled={isReordering}
              className="space-y-2"
              onReorder={handleReorder}
              renderItem={(section) => {
                const warning = homeSectionStorefrontWarning(section);
                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-brand-950">
                          {section.title?.trim() ||
                            section.category?.name ||
                            (section.type === "FEATURED_PRODUCTS"
                              ? "Featured"
                              : "Untitled")}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                          {HOME_SECTION_TYPE_LABEL[section.type]}
                          {section.category
                            ? ` · ${section.category.name}`
                            : ""}{" "}
                          · limit {section.productLimit} · sort {section.sortOrder}
                        </p>
                      </div>
                      <span className="hidden w-32 shrink-0 text-xs text-slate-600 sm:block">
                        {HOME_SECTION_TYPE_LABEL[section.type]}
                      </span>
                      <span className="hidden w-32 shrink-0 truncate text-xs text-slate-600 sm:block">
                        {section.type === "FEATURED_PRODUCTS"
                          ? "—"
                          : (section.category?.name ?? "Missing")}
                      </span>
                      <span className="hidden w-12 shrink-0 text-xs text-slate-600 sm:block">
                        {section.productLimit}
                      </span>
                      <StatusPill
                        label={section.isActive ? "Active" : "Inactive"}
                        tone={section.isActive ? "success" : "danger"}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(section)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                        >
                          {section.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(section)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(section)}
                          className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {warning ? (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                        {warning}
                      </p>
                    ) : null}
                  </div>
                );
              }}
            />
          </div>
        ) : null}
      </AdminPanel>

      {dialogMode ? (
        <HomeSectionFormDialog
          key={dialogMode === "edit" ? (editingSection?.id ?? "edit") : "create"}
          mode={dialogMode}
          section={editingSection}
          tree={treeData?.data ?? []}
          saving={saving}
          error={formError}
          onClose={closeDialog}
          onSubmit={(payload) => void handleSubmit(payload)}
        />
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/40 p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close delete dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-home-section-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-home-section-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Delete homepage section
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete{" "}
              <span className="font-semibold text-brand-950">
                {deleteTarget.title?.trim() ||
                  deleteTarget.category?.name ||
                  "this section"}
              </span>
              ? This cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
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
