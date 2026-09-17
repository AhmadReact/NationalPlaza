"use client";

import { useMemo, useState } from "react";
import { AdminForbidden } from "@/components/admin/forbidden";
import {
  AdminPanel,
  AdminPrimaryButton,
  StatusPill,
} from "@/components/admin/ui";
import {
  useCreateWhatsAppRecipientMutation,
  useDeleteWhatsAppRecipientMutation,
  useGetWhatsAppRecipientsQuery,
  useUpdateWhatsAppRecipientMutation,
  type CreateWhatsAppAdminRecipientRequest,
  type UpdateWhatsAppAdminRecipientRequest,
  type WhatsAppAdminRecipient,
} from "@/app/admin/(panel)/whatsapp/store/whatsappAPI";
import {
  extractApiFieldErrors,
  getFetchErrorMessage,
  getRtkErrorData,
  getRtkErrorStatus,
  isForbiddenError,
  isNotFoundError,
} from "@/lib/api/errorMessage";
import { formatWhatsAppPhoneDisplay } from "@/lib/phone";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch } from "@/lib/store/hooks";

const PHONE_MAX = 20;
const LABEL_MAX = 80;

type DialogMode = "create" | "edit";

type FormState = {
  phoneNumber: string;
  label: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  phoneNumber: "",
  label: "",
  isActive: true,
};

function rtkError(error: unknown, fallback: string): string {
  return getFetchErrorMessage(
    error as { status?: number | string; data?: unknown; error?: string },
    fallback,
  );
}

function formFromRecipient(recipient: WhatsAppAdminRecipient): FormState {
  return {
    phoneNumber: recipient.phoneNumber,
    label: recipient.label ?? "",
    isActive: recipient.isActive,
  };
}

function phoneErrorFromApi(error: unknown): string | null {
  const fields = extractApiFieldErrors(getRtkErrorData(error));
  const match = fields.find((item) => {
    const field = item.field?.trim();
    if (!field) return false;
    return field === "phoneNumber" || field === "phone";
  });
  if (match) return match.message;

  const status = getRtkErrorStatus(error);
  if (status === 400 || status === 409) {
    return rtkError(
      error,
      status === 409
        ? "This WhatsApp number is already on the admin recipient list"
        : "Invalid WhatsApp phone number",
    );
  }

  return null;
}

function changedUpdateFields(
  original: WhatsAppAdminRecipient,
  form: FormState,
): UpdateWhatsAppAdminRecipientRequest {
  const body: UpdateWhatsAppAdminRecipientRequest = {};
  const phone = form.phoneNumber.trim();
  const label = form.label.trim();
  const originalLabel = original.label ?? "";

  if (phone !== original.phoneNumber) body.phoneNumber = phone;
  if (label !== originalLabel) body.label = label;
  if (form.isActive !== original.isActive) body.isActive = form.isActive;

  return body;
}

export function WhatsAppRecipientsPanel() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetWhatsAppRecipientsQuery();
  const [createRecipient, { isLoading: isCreating }] =
    useCreateWhatsAppRecipientMutation();
  const [updateRecipient, { isLoading: isUpdating }] =
    useUpdateWhatsAppRecipientMutation();
  const [deleteRecipient, { isLoading: isDeleting }] =
    useDeleteWhatsAppRecipientMutation();

  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [editing, setEditing] = useState<WhatsAppAdminRecipient | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppAdminRecipient | null>(
    null,
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const recipients = data?.data ?? [];
  const isSaving = isCreating || isUpdating;
  const busy = isSaving || isDeleting || togglingId !== null;

  const listError = useMemo(() => {
    if (!isError) return null;
    return rtkError(error, "Failed to load staff recipients.");
  }, [error, isError]);

  function openCreate() {
    setDialogMode("create");
    setEditing(null);
    setForm(emptyForm);
    setPhoneError(null);
    setFormError(null);
  }

  function openEdit(recipient: WhatsAppAdminRecipient) {
    setDialogMode("edit");
    setEditing(recipient);
    setForm(formFromRecipient(recipient));
    setPhoneError(null);
    setFormError(null);
  }

  function closeDialog(force = false) {
    if (isSaving && !force) return;
    setDialogMode(null);
    setEditing(null);
    setForm(emptyForm);
    setPhoneError(null);
    setFormError(null);
  }

  function validateForm(): boolean {
    const phone = form.phoneNumber.trim();
    if (!phone) {
      setPhoneError("Phone number is required.");
      return false;
    }
    if (phone.length > PHONE_MAX) {
      setPhoneError(`Phone number must be ${PHONE_MAX} characters or fewer.`);
      return false;
    }
    if (form.label.length > LABEL_MAX) {
      setFormError(`Label must be ${LABEL_MAX} characters or fewer.`);
      return false;
    }
    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPhoneError(null);
    setFormError(null);
    if (!validateForm()) return;

    const phone = form.phoneNumber.trim();
    const label = form.label.trim();

    try {
      if (dialogMode === "create") {
        const body: CreateWhatsAppAdminRecipientRequest = {
          phoneNumber: phone,
          isActive: form.isActive,
        };
        if (label) body.label = label;

        const result = await createRecipient(body).unwrap();
        const stored = result.data?.phoneNumber;
        dispatch(
          toast.success(
            stored
              ? `${result.message || "Staff recipient saved."} Stored as ${stored}.`
              : result.message || "Staff recipient saved.",
          ),
        );
      } else if (dialogMode === "edit" && editing) {
        const body = changedUpdateFields(editing, form);
        if (Object.keys(body).length === 0) {
          closeDialog(true);
          return;
        }

        const result = await updateRecipient({
          id: editing.id,
          ...body,
        }).unwrap();
        const stored = result.data?.phoneNumber;
        dispatch(
          toast.success(
            stored
              ? `${result.message || "Staff recipient updated."} Stored as ${stored}.`
              : result.message || "Staff recipient updated.",
          ),
        );
      }
      closeDialog(true);
    } catch (err) {
      const fieldMessage = phoneErrorFromApi(err);
      if (fieldMessage) {
        setPhoneError(fieldMessage);
        return;
      }
      setFormError(
        rtkError(
          err,
          dialogMode === "create"
            ? "Failed to add staff recipient."
            : "Failed to update staff recipient.",
        ),
      );
    }
  }

  async function handleToggle(recipient: WhatsAppAdminRecipient) {
    setTogglingId(recipient.id);
    try {
      const result = await updateRecipient({
        id: recipient.id,
        isActive: !recipient.isActive,
      }).unwrap();
      const next = result.data;
      dispatch(
        toast.success(
          result.message ||
            (next?.isActive
              ? "Staff recipient is active."
              : "Staff recipient paused."),
        ),
      );
    } catch (err) {
      dispatch(
        toast.error(
          rtkError(err, "Could not update the staff recipient."),
        ),
      );
      if (isNotFoundError(err)) {
        void refetch();
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteRecipient(deleteTarget.id).unwrap();
      dispatch(
        toast.success(result.message || "Staff recipient deleted."),
      );
      setDeleteTarget(null);
      void refetch();
    } catch (err) {
      dispatch(
        toast.error(rtkError(err, "Could not delete the staff recipient.")),
      );
      if (isNotFoundError(err)) {
        setDeleteTarget(null);
        void refetch();
      }
    }
  }

  if (isForbiddenError(error)) {
    return <AdminForbidden permission="NOTIFICATIONS" />;
  }

  return (
    <>
      <AdminPanel
        title="Staff recipients"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-60"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
            <AdminPrimaryButton onClick={openCreate} disabled={busy}>
              Add number
            </AdminPrimaryButton>
          </div>
        }
      >
        <p className="mb-4 text-sm text-slate-600">
          These numbers get a WhatsApp alert when a customer places an order.
          Inactive numbers are skipped. In Meta development mode, each number
          must be on the allowed recipients list.
        </p>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading staff recipients…
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

        {!isLoading && !listError && recipients.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No staff numbers yet. New orders will not WhatsApp admins until you
            add one.
          </p>
        ) : null}

        {!isLoading && !listError && recipients.length > 0 ? (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">Label</th>
                  <th className="px-5 py-3 font-semibold">Phone</th>
                  <th className="px-5 py-3 font-semibold">Active</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((item) => {
                  const formatted = formatWhatsAppPhoneDisplay(item.phoneNumber);
                  const rowBusy = busy && togglingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-brand-50/40"
                    >
                      <td className="px-5 py-3.5 text-slate-700">
                        {item.label ? (
                          <span className="font-medium text-brand-950">
                            {item.label}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <p className="font-mono text-sm text-brand-950">
                          {item.phoneNumber}
                        </p>
                        {formatted !== item.phoneNumber ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatted}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <div className="flex items-center gap-2">
                          <StatusPill
                            label={item.isActive ? "Active" : "Inactive"}
                            tone={item.isActive ? "success" : "neutral"}
                          />
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.isActive}
                            aria-label={
                              item.isActive
                                ? `Pause ${item.label || item.phoneNumber}`
                                : `Activate ${item.label || item.phoneNumber}`
                            }
                            disabled={busy}
                            onClick={() => void handleToggle(item)}
                            className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                              item.isActive ? "bg-brand-900" : "bg-slate-200"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                item.isActive
                                  ? "translate-x-4"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                          {rowBusy ? (
                            <span className="text-[11px] text-slate-400">
                              Saving…
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openEdit(item)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
            aria-labelledby="whatsapp-recipient-dialog-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2
                id="whatsapp-recipient-dialog-title"
                className="font-display text-lg font-bold text-brand-950"
              >
                {dialogMode === "create"
                  ? "Add staff number"
                  : "Edit staff number"}
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
                  Phone number *
                </span>
                <input
                  type="tel"
                  required
                  maxLength={PHONE_MAX}
                  value={form.phoneNumber}
                  onChange={(e) => {
                    setPhoneError(null);
                    setForm((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }));
                  }}
                  placeholder="03001111111"
                  aria-invalid={Boolean(phoneError)}
                  className={`w-full rounded-xl border-2 bg-white px-4 py-2.5 text-sm outline-none focus:bg-white ${
                    phoneError
                      ? "border-red-300 focus:border-red-500"
                      : "border-brand-900/10 focus:border-brand-600"
                  }`}
                />
                {phoneError ? (
                  <p className="mt-1.5 text-sm text-red-700">{phoneError}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Accepts 03XXXXXXXXX, +92…, or 92…. Max {PHONE_MAX}{" "}
                    characters. Stored as a normalized number after save.
                  </p>
                )}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Label
                </span>
                <input
                  maxLength={LABEL_MAX}
                  value={form.label}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="Store manager"
                  className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  {form.label.length}/{LABEL_MAX}
                </span>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
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
                Active
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
                      ? "Add number"
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
            aria-labelledby="delete-whatsapp-recipient-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-whatsapp-recipient-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Delete staff number
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Remove{" "}
              <span className="font-semibold text-brand-950">
                {deleteTarget.label || deleteTarget.phoneNumber}
              </span>
              {deleteTarget.label ? ` (${deleteTarget.phoneNumber})` : ""} from
              new-order WhatsApp alerts? This cannot be undone.
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
