"use client";

import { useMemo, useState } from "react";
import { useLazyGetMeQuery } from "@/app/admin/login/store/authAPI";
import { selectAuthUser, setAuthUser } from "@/app/admin/login/store/authSlice";
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useGetRolesQuery,
  useUpdateRoleMutation,
  type Role,
} from "@/app/admin/(panel)/roles/store/roleAPI";
import { PermissionChecklist } from "@/components/admin/permission-checklist";
import { PermissionChips } from "@/components/admin/permission-chips";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  AdminTable,
  StatusPill,
} from "@/components/admin/ui";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { PERMISSIONS, type Permission } from "@/lib/rbac";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";

type RoleFormState = {
  name: string;
  slug: string;
  description: string;
  permissions: Permission[];
};

const emptyForm: RoleFormState = {
  name: "",
  slug: "",
  description: "",
  permissions: [],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isAdminRole(role: Pick<Role, "slug"> | RoleFormState): boolean {
  return role.slug.trim().toUpperCase() === "ADMIN";
}

function rtkError(error: unknown, fallback: string): string {
  return getFetchErrorMessage(
    error as { status?: number | string; data?: unknown; error?: string },
    fallback,
  );
}

export default function AdminRolesPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectAuthUser);
  const [getMe] = useLazyGetMeQuery();

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetRolesQuery();
  const { data: permissionsData } = useGetPermissionsQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const roles = data?.data ?? [];
  const catalog = permissionsData?.data?.length
    ? permissionsData.data
    : [...PERMISSIONS];
  const isSaving = isCreating || isUpdating;
  const adminLocked = Boolean(
    editingRole && isAdminRole(editingRole) && dialogMode === "edit",
  );

  const listErrorMessage = useMemo(() => {
    if (!isError) return null;
    return rtkError(error, "Failed to load roles.");
  }, [error, isError]);

  async function refreshCurrentUserIfNeeded(roleId: string) {
    if (!currentUser || currentUser.roleId !== roleId) return;
    try {
      const result = await getMe().unwrap();
      if (result.data) dispatch(setAuthUser(result.data));
    } catch {
      // interceptor handles auth failures
    }
  }

  function openCreate() {
    setDialogMode("create");
    setEditingRole(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setFormError(null);
  }

  function openEdit(role: Role) {
    setDialogMode("edit");
    setEditingRole(role);
    setForm({
      name: role.name,
      slug: role.slug,
      description: role.description ?? "",
      permissions: isAdminRole(role) ? [...catalog] : [...role.permissions],
    });
    setSlugTouched(true);
    setFormError(null);
  }

  function closeDialog(force = false) {
    if (isSaving && !force) return;
    setDialogMode(null);
    setEditingRole(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setFormError(null);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug:
        slugTouched || editingRole?.isSystem
          ? prev.slug
          : slugify(name),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    if (name.length < 2 || name.length > 80) {
      setFormError("Name must be between 2 and 80 characters.");
      return;
    }

    const permissions = adminLocked ? [...catalog] : form.permissions;

    try {
      if (dialogMode === "create") {
        const result = await createRole({
          name,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          permissions,
        }).unwrap();
        dispatch(toast.success(result.message || "Role created"));
      } else if (dialogMode === "edit" && editingRole) {
        const result = await updateRole({
          id: editingRole.id,
          name,
          slug: editingRole.isSystem ? undefined : form.slug.trim() || undefined,
          description: form.description.trim() || null,
          permissions,
        }).unwrap();
        dispatch(toast.success(result.message || "Role updated"));
        await refreshCurrentUserIfNeeded(editingRole.id);
      }
      closeDialog(true);
    } catch (err) {
      setFormError(
        rtkError(
          err,
          dialogMode === "create"
            ? "Failed to create role."
            : "Failed to update role.",
        ),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteRole(deleteTarget.id).unwrap();
      dispatch(toast.success(result.message || "Role deleted"));
      setDeleteTarget(null);
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to delete role.")));
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Roles"
        description="Define permission sets. Users pick up role changes on their next API request."
        action={
          <AdminPrimaryButton onClick={openCreate}>Add role</AdminPrimaryButton>
        }
      />

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-50 disabled:opacity-60"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <AdminPanel title={`${roles.length} role${roles.length === 1 ? "" : "s"}`}>
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading roles…
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

        {!isLoading && !listErrorMessage && roles.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No roles yet.
          </p>
        ) : null}

        {!isLoading && !listErrorMessage && roles.length > 0 ? (
          <AdminTable
            columns={[
              "Name",
              "Slug",
              "Permissions",
              "Users",
              "Type",
              "Actions",
            ]}
            rows={roles.map((role) => [
              <div key={`${role.id}-name`}>
                <p className="font-semibold text-brand-950">{role.name}</p>
                {role.description ? (
                  <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                    {role.description}
                  </p>
                ) : null}
              </div>,
              <span key={`${role.id}-slug`} className="font-mono text-xs">
                {role.slug}
              </span>,
              <PermissionChips
                key={`${role.id}-perms`}
                permissions={role.permissions}
              />,
              String(role.userCount),
              role.isSystem ? (
                <StatusPill
                  key={`${role.id}-type`}
                  label="System"
                  tone="info"
                />
              ) : (
                <StatusPill
                  key={`${role.id}-type`}
                  label="Custom"
                  tone="neutral"
                />
              ),
              <div key={`${role.id}-actions`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(role)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={role.isSystem || role.userCount > 0}
                  title={
                    role.isSystem
                      ? "System roles cannot be deleted"
                      : role.userCount > 0
                        ? "Reassign users before deleting this role"
                        : "Delete role"
                  }
                  onClick={() => setDeleteTarget(role)}
                  className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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
            aria-labelledby="role-dialog-title"
            className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <h2
                id="role-dialog-title"
                className="font-display text-lg font-bold text-brand-950"
              >
                {dialogMode === "create" ? "Add role" : "Edit role"}
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
              {editingRole?.isSystem ? (
                <p className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800">
                  System role. Slug cannot be changed
                  {adminLocked
                    ? ", and Admin must keep every permission."
                    : "."}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name *
                  </span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                    placeholder="Warehouse clerk"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Slug
                  </span>
                  <input
                    value={form.slug}
                    disabled={Boolean(editingRole?.isSystem)}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 font-mono text-sm outline-none focus:border-brand-600 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="warehouse-clerk"
                  />
                </label>
              </div>

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
                />
              </label>

              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Permissions
                </span>
                <PermissionChecklist
                  catalog={catalog}
                  selected={adminLocked ? catalog : form.permissions}
                  locked={adminLocked}
                  onChange={(permissions) =>
                    setForm((prev) => ({ ...prev, permissions }))
                  }
                />
              </div>

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
                      ? "Create role"
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
            aria-labelledby="delete-role-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-role-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Delete role
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete{" "}
              <span className="font-semibold text-brand-950">
                {deleteTarget.name}
              </span>
              ? Custom roles with no users can be removed.
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
