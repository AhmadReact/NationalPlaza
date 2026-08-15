"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  AdminTable,
  StatusPill,
} from "@/components/admin/ui";
import {
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useGetBrandsQuery,
  useUpdateBrandMutation,
  type Brand,
  type BrandStatus,
} from "@/app/admin/(panel)/brands/store/brandAPI";
import { useAppDispatch } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";

type BrandFormState = {
  name: string;
  slug: string;
  description: string;
  status: BrandStatus;
  logo: File | null;
  removeLogo: boolean;
};

const emptyForm: BrandFormState = {
  name: "",
  slug: "",
  description: "",
  status: "ACTIVE",
  logo: null,
  removeLogo: false,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function statusTone(status?: string) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "active") return "success" as const;
  if (normalized === "inactive") return "danger" as const;
  return "neutral" as const;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }
  if (error && typeof error === "object" && "status" in error) {
    return `Request failed (${String((error as { status?: unknown }).status)})`;
  }
  return fallback;
}

export default function AdminBrandsPage() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BrandStatus | "">("");
  const limit = 20;

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetBrandsQuery({
      page,
      limit,
      search: search || undefined,
      status: statusFilter || undefined,
    });

  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();

  const brands = data?.data ?? [];
  const meta = data?.meta;
  const isSaving = isCreating || isUpdating;

  const listErrorMessage = useMemo(() => {
    if (!isError) return null;
    return getErrorMessage(error, "Failed to load brands.");
  }, [error, isError]);

  useEffect(() => {
    if (!form.logo) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(form.logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.logo]);

  function openCreate() {
    setDialogMode("create");
    setEditingBrand(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setFormError(null);
  }

  function openEdit(brand: Brand) {
    setDialogMode("edit");
    setEditingBrand(brand);
    setForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description ?? "",
      status: brand.status || "ACTIVE",
      logo: null,
      removeLogo: false,
    });
    setSlugTouched(true);
    setFormError(null);
  }

  function closeDialog(force = false) {
    if (isSaving && !force) return;
    setDialogMode(null);
    setEditingBrand(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setFormError(null);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
    }));
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }

    try {
      if (dialogMode === "create") {
        const result = await createBrand({
          name,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          status: form.status || undefined,
          logo: form.logo,
        }).unwrap();
        dispatch(
          toast.success(result.message || "Brand created successfully"),
        );
      } else if (dialogMode === "edit" && editingBrand) {
        const result = await updateBrand({
          id: editingBrand.id,
          name,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          status: form.status || undefined,
          removeLogo: form.removeLogo,
          logo: form.logo,
        }).unwrap();
        dispatch(
          toast.success(result.message || "Brand updated successfully"),
        );
      }
      closeDialog(true);
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          dialogMode === "create"
            ? "Failed to create brand."
            : "Failed to update brand.",
        ),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteBrand(deleteTarget.id).unwrap();
      dispatch(
        toast.success(result.message || "Brand deleted successfully"),
      );
      setDeleteTarget(null);
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to delete brand.")),
      );
    }
  }

  const currentLogoSrc =
    logoPreview ??
    (!form.removeLogo && editingBrand?.logo ? editingBrand.logo : null);

  return (
    <>
      <AdminPageHeader
        title="Brands"
        description="Manage manufacturer brands shown on the store."
        action={
          <AdminPrimaryButton onClick={openCreate}>Add brand</AdminPrimaryButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full max-w-lg items-center gap-2"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, slug, or description…"
            className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-50 disabled:opacity-60"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <AdminPanel
        title={
          meta
            ? `${meta.total} brand${meta.total === 1 ? "" : "s"}`
            : "Brands"
        }
      >
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading brands…
          </p>
        ) : null}

        {!isLoading && listErrorMessage ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-red-700">{listErrorMessage}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 text-sm font-semibold text-brand-800 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !listErrorMessage && brands.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {search || statusFilter
              ? "No brands match your filters."
              : "No brands yet. Add your first brand to get started."}
          </p>
        ) : null}

        {!isLoading && !listErrorMessage && brands.length > 0 ? (
          <>
            <AdminTable
              columns={["Brand", "Slug", "Description", "Status", "Actions"]}
              rows={brands.map((brand) => [
                <div key={brand.id} className="flex items-center gap-3">
                  {brand.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logo}
                      alt=""
                      className="h-9 w-9 rounded-lg border border-slate-100 object-cover"
                    />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-800">
                      {brand.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="font-semibold text-brand-950">
                    {brand.name}
                  </span>
                </div>,
                <span key={`${brand.id}-slug`} className="font-mono text-xs">
                  {brand.slug}
                </span>,
                <span
                  key={`${brand.id}-desc`}
                  className="line-clamp-1 max-w-[220px]"
                >
                  {brand.description?.trim() || "—"}
                </span>,
                <StatusPill
                  key={`${brand.id}-status`}
                  label={brand.status || "—"}
                  tone={statusTone(brand.status)}
                />,
                <div key={`${brand.id}-actions`} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(brand)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(brand)}
                    className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>,
              ])}
            />

            {meta && meta.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!meta.hasPreviousPage || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!meta.hasNextPage || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </AdminPanel>

      {dialogMode ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/40 p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 cursor-default"
            onClick={closeDialog}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-dialog-title"
            className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2
                id="brand-dialog-title"
                className="font-display text-lg font-bold text-brand-950"
              >
                {dialogMode === "create" ? "Add brand" : "Edit brand"}
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isSaving}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-brand-950 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Name *
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  placeholder="Nike"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Slug
                </span>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 font-mono text-sm outline-none focus:border-brand-600"
                  placeholder="nike"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full resize-y rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  placeholder="Just Do It."
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Logo
                </span>
                <div className="flex items-start gap-3">
                  {currentLogoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentLogoSrc}
                      alt=""
                      className="h-14 w-14 rounded-xl border border-slate-100 object-cover"
                    />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                      No logo
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setForm((prev) => ({
                          ...prev,
                          logo: file,
                          removeLogo: false,
                        }));
                      }}
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-900 hover:file:bg-brand-100"
                    />
                    {dialogMode === "edit" && editingBrand?.logo ? (
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={form.removeLogo}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              removeLogo: e.target.checked,
                              logo: e.target.checked ? null : prev.logo,
                            }))
                          }
                          className="rounded border-slate-300"
                        />
                        Remove current logo
                      </label>
                    ) : null}
                  </div>
                </div>
              </div>

              {formError ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving…"
                    : dialogMode === "create"
                      ? "Create brand"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
            aria-labelledby="delete-brand-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-brand-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Delete brand
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete{" "}
              <span className="font-semibold text-brand-950">
                {deleteTarget.name}
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
                onClick={handleDelete}
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
