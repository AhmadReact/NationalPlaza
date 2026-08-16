"use client";

import { useMemo, useState } from "react";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  AdminTable,
  StatusPill,
} from "@/components/admin/ui";
import {
  useCreateDeliveryMethodMutation,
  useDeleteDeliveryMethodMutation,
  useGetAdminDeliveryMethodsQuery,
  useUpdateDeliveryMethodMutation,
  type DeliveryMethod,
} from "@/app/admin/(panel)/delivery-methods/store/deliveryAPI";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { formatPrice } from "@/lib/data";
import { useAppDispatch } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";

type DeliveryFormState = {
  code: string;
  name: string;
  description: string;
  price: string;
  estimatedDaysMin: string;
  estimatedDaysMax: string;
  isActive: boolean;
  sortOrder: string;
};

type StatusFilter = "all" | "active" | "inactive";

const emptyForm: DeliveryFormState = {
  code: "",
  name: "",
  description: "",
  price: "0",
  estimatedDaysMin: "",
  estimatedDaysMax: "",
  isActive: true,
  sortOrder: "0",
};

function codeify(value: string): string {
  return value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function rtkError(error: unknown, fallback: string): string {
  return getFetchErrorMessage(
    error as { status?: number | string; data?: unknown; error?: string },
    fallback,
  );
}

function formatEta(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) {
    if (min === max) return `${min} day${min === 1 ? "" : "s"}`;
    return `${min}–${max} days`;
  }
  if (min != null) return `From ${min} day${min === 1 ? "" : "s"}`;
  return `Up to ${max} day${max === 1 ? "" : "s"}`;
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return Number.NaN;
  return parsed;
}

export default function AdminDeliveryMethodsPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAdminDeliveryMethodsQuery();
  const [createMethod, { isLoading: isCreating }] =
    useCreateDeliveryMethodMutation();
  const [updateMethod, { isLoading: isUpdating }] =
    useUpdateDeliveryMethodMutation();
  const [deleteMethod, { isLoading: isDeleting }] =
    useDeleteDeliveryMethodMutation();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(
    null,
  );
  const [form, setForm] = useState<DeliveryFormState>(emptyForm);
  const [codeTouched, setCodeTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryMethod | null>(null);

  const methods = useMemo(() => {
    const list = [...(data?.data ?? [])];
    list.sort((a, b) => {
      const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (order !== 0) return order;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [data?.data]);

  const visibleMethods = useMemo(() => {
    if (statusFilter === "active") return methods.filter((m) => m.isActive);
    if (statusFilter === "inactive") return methods.filter((m) => !m.isActive);
    return methods;
  }, [methods, statusFilter]);

  const isSaving = isCreating || isUpdating;

  const listErrorMessage = useMemo(() => {
    if (!isError) return null;
    return rtkError(error, "Failed to load delivery methods.");
  }, [error, isError]);

  function openCreate() {
    setDialogMode("create");
    setEditingMethod(null);
    setForm(emptyForm);
    setCodeTouched(false);
    setFormError(null);
  }

  function openEdit(method: DeliveryMethod) {
    setDialogMode("edit");
    setEditingMethod(method);
    setForm({
      code: method.code,
      name: method.name,
      description: method.description ?? "",
      price: String(method.price ?? 0),
      estimatedDaysMin:
        method.estimatedDaysMin == null ? "" : String(method.estimatedDaysMin),
      estimatedDaysMax:
        method.estimatedDaysMax == null ? "" : String(method.estimatedDaysMax),
      isActive: method.isActive,
      sortOrder: String(method.sortOrder ?? 0),
    });
    setCodeTouched(true);
    setFormError(null);
  }

  function closeDialog(force = false) {
    if (isSaving && !force) return;
    setDialogMode(null);
    setEditingMethod(null);
    setForm(emptyForm);
    setCodeTouched(false);
    setFormError(null);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      code: codeTouched ? prev.code : codeify(name),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }

    const code = form.code.trim().toUpperCase();
    if (dialogMode === "create" && !code) {
      setFormError("Code is required.");
      return;
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setFormError("Price must be 0 or greater.");
      return;
    }

    const estimatedDaysMin = parseOptionalInt(form.estimatedDaysMin);
    const estimatedDaysMax = parseOptionalInt(form.estimatedDaysMax);
    if (Number.isNaN(estimatedDaysMin) || Number.isNaN(estimatedDaysMax)) {
      setFormError("Estimated days must be whole numbers.");
      return;
    }
    if (
      estimatedDaysMin != null &&
      estimatedDaysMax != null &&
      estimatedDaysMin > estimatedDaysMax
    ) {
      setFormError("Minimum days cannot be greater than maximum days.");
      return;
    }

    const sortOrder = parseOptionalInt(form.sortOrder);
    if (sortOrder == null || Number.isNaN(sortOrder)) {
      setFormError("Sort order must be a whole number.");
      return;
    }

    try {
      if (dialogMode === "create") {
        const result = await createMethod({
          code,
          name,
          price,
          description: form.description.trim() || undefined,
          estimatedDaysMin: estimatedDaysMin ?? undefined,
          estimatedDaysMax: estimatedDaysMax ?? undefined,
          isActive: form.isActive,
          sortOrder,
        }).unwrap();
        dispatch(
          toast.success(result.message || "Delivery method created"),
        );
      } else if (dialogMode === "edit" && editingMethod) {
        const result = await updateMethod({
          id: editingMethod.id,
          name,
          description: form.description.trim() || null,
          price,
          estimatedDaysMin,
          estimatedDaysMax,
          isActive: form.isActive,
          sortOrder,
        }).unwrap();
        dispatch(
          toast.success(result.message || "Delivery method updated"),
        );
      }
      closeDialog(true);
    } catch (err) {
      setFormError(
        rtkError(
          err,
          dialogMode === "create"
            ? "Failed to create delivery method."
            : "Failed to update delivery method.",
        ),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteMethod(deleteTarget.id).unwrap();
      dispatch(toast.success(result.message || "Delivery method deleted"));
      setDeleteTarget(null);
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to delete delivery method.")));
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Delivery"
        description="Shipping methods, rates, and estimated delivery times shown at checkout."
        action={
          <AdminPrimaryButton onClick={openCreate}>
            Add method
          </AdminPrimaryButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="all">All methods</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
        title={`${visibleMethods.length} method${visibleMethods.length === 1 ? "" : "s"}`}
      >
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading delivery methods…
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

        {!isLoading && !listErrorMessage && visibleMethods.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {statusFilter === "all"
              ? "No delivery methods yet. Add one to offer shipping at checkout."
              : "No delivery methods match this filter."}
          </p>
        ) : null}

        {!isLoading && !listErrorMessage && visibleMethods.length > 0 ? (
          <AdminTable
            columns={[
              "Method",
              "Code",
              "Price",
              "ETA",
              "Order",
              "Status",
              "Actions",
            ]}
            rows={visibleMethods.map((method) => [
              <div key={`${method.id}-name`}>
                <p className="font-semibold text-brand-950">{method.name}</p>
                {method.description ? (
                  <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                    {method.description}
                  </p>
                ) : null}
              </div>,
              <span key={`${method.id}-code`} className="font-mono text-xs">
                {method.code}
              </span>,
              method.price === 0 ? "Free" : formatPrice(method.price),
              formatEta(method.estimatedDaysMin, method.estimatedDaysMax),
              String(method.sortOrder ?? 0),
              <StatusPill
                key={`${method.id}-status`}
                label={method.isActive ? "Active" : "Inactive"}
                tone={method.isActive ? "success" : "neutral"}
              />,
              <div
                key={`${method.id}-actions`}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => openEdit(method)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(method)}
                  className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>,
            ])}
          />
        ) : null}
      </AdminPanel>

      {dialogMode ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/40 p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => closeDialog()}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-dialog-title"
            className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <h2
                id="delivery-dialog-title"
                className="font-display text-lg font-bold text-brand-950"
              >
                {dialogMode === "create"
                  ? "Add delivery method"
                  : "Edit delivery method"}
              </h2>
              <button
                type="button"
                onClick={() => closeDialog()}
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
                  placeholder="Standard Shipping"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Code *
                </span>
                <input
                  required={dialogMode === "create"}
                  value={form.code}
                  disabled={dialogMode === "edit"}
                  onChange={(e) => {
                    setCodeTouched(true);
                    setForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }));
                  }}
                  className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 font-mono text-sm outline-none focus:border-brand-600 disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="STANDARD"
                />
                {dialogMode === "edit" ? (
                  <span className="mt-1 block text-xs text-slate-500">
                    Code cannot be changed after creation.
                  </span>
                ) : null}
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
                  rows={2}
                  className="w-full resize-y rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  placeholder="Delivered in 5–7 business days"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Price (Rs.) *
                  </span>
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                    placeholder="0"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sort order
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Min days
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={form.estimatedDaysMin}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        estimatedDaysMin: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                    placeholder="5"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Max days
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={form.estimatedDaysMax}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        estimatedDaysMax: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                    placeholder="7"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-brand-950">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300"
                />
                Active (shown at checkout)
              </label>

              {formError ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => closeDialog()}
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
                      ? "Create method"
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
            aria-labelledby="delete-delivery-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-delivery-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Delete delivery method
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete{" "}
              <span className="font-semibold text-brand-950">
                {deleteTarget.name}
              </span>
              ? Customers will no longer see this option at checkout.
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
