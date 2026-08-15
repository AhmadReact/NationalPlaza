"use client";

import { useMemo, useState } from "react";
import { useLazyGetMeQuery } from "@/app/admin/login/store/authAPI";
import { selectAuthUser, setAuthUser } from "@/app/admin/login/store/authSlice";
import { useGetPermissionsQuery, useGetRolesQuery } from "@/app/admin/(panel)/roles/store/roleAPI";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useLazyGetUserByIdQuery,
  useRestoreUserMutation,
  useSetUserExtraPermissionsMutation,
  useUpdateUserMutation,
  type AdminUser,
} from "@/app/admin/(panel)/users/store/userAPI";
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
import {
  PERMISSIONS,
  type Permission,
  type UserStatus,
} from "@/lib/rbac";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
  status: UserStatus;
  extraPermissions: Permission[];
};

const emptyForm: UserFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  roleId: "",
  status: "ACTIVE",
  extraPermissions: [],
};

function statusTone(status?: string) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "ACTIVE") return "success" as const;
  if (normalized === "SUSPENDED") return "danger" as const;
  return "neutral" as const;
}

function rtkError(error: unknown, fallback: string): string {
  return getFetchErrorMessage(
    error as { status?: number | string; data?: unknown; error?: string },
    fallback,
  );
}

function displayName(user: AdminUser): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
}

export default function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectAuthUser);
  const [getMe] = useLazyGetMeQuery();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const limit = 20;

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetUsersQuery({
      page,
      limit,
      search: search || undefined,
      roleId: roleFilter || undefined,
      status: statusFilter || undefined,
    });
  const { data: rolesData } = useGetRolesQuery();
  const { data: permissionsData } = useGetPermissionsQuery();
  const [fetchUserById] = useLazyGetUserByIdQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [setExtraPermissions, { isLoading: isSavingExtras }] =
    useSetUserExtraPermissionsMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [restoreUser, { isLoading: isRestoring }] = useRestoreUserMutation();
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const users = data?.data ?? [];
  const meta = data?.meta;
  const roles = rolesData?.data ?? [];
  const catalog = permissionsData?.data?.length
    ? permissionsData.data
    : [...PERMISSIONS];
  const isSaving = isCreating || isUpdating || isSavingExtras || isRestoring;

  const selectedRole = roles.find((role) => role.id === form.roleId);
  const rolePermissions = selectedRole?.permissions ??
    editingUser?.rolePermissions ??
    [];
  const effectivePermissions = Array.from(
    new Set([...rolePermissions, ...form.extraPermissions]),
  );

  const listErrorMessage = useMemo(() => {
    if (!isError) return null;
    return rtkError(error, "Failed to load users.");
  }, [error, isError]);

  const hasActiveFilters = Boolean(search || roleFilter || statusFilter);

  async function refreshCurrentUserIfNeeded(userId: string) {
    if (!currentUser || currentUser.id !== userId) return;
    try {
      const result = await getMe().unwrap();
      if (result.data) dispatch(setAuthUser(result.data));
    } catch {
      // interceptor handles auth failures
    }
  }

  function openCreate() {
    const defaultRole =
      roles.find((role) => role.isDefault) ??
      roles.find((role) => role.slug.toUpperCase() === "CUSTOMER");
    setDialogMode("create");
    setEditingUser(null);
    setForm({
      ...emptyForm,
      roleId: defaultRole?.id ?? "",
    });
    setFormError(null);
  }

  function populateForm(user: AdminUser) {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      phone: user.phone ?? "",
      roleId: user.roleId,
      status: (user.status as UserStatus) || "ACTIVE",
      extraPermissions: [...user.extraPermissions],
    });
    setFormError(null);
  }

  async function openEdit(user: AdminUser) {
    setDialogMode("edit");
    populateForm(user);
    setIsLoadingUser(true);
    try {
      const result = await fetchUserById(user.id).unwrap();
      populateForm(result.data);
    } catch (err) {
      setFormError(rtkError(err, "Could not load user details."));
    } finally {
      setIsLoadingUser(false);
    }
  }

  function closeDialog(force = false) {
    if (isSaving && !force) return;
    setDialogMode(null);
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (firstName.length < 1 || lastName.length < 1) {
      setFormError("First and last name are required.");
      return;
    }
    if (!email) {
      setFormError("Email is required.");
      return;
    }

    try {
      if (dialogMode === "create") {
        if (form.password.length < 8) {
          setFormError("Password must be at least 8 characters.");
          return;
        }
        const result = await createUser({
          firstName,
          lastName,
          email,
          password: form.password,
          phone: form.phone.trim() || undefined,
          roleId: form.roleId || undefined,
          status: form.status,
          extraPermissions: form.extraPermissions,
        }).unwrap();
        dispatch(toast.success(result.message || "User created"));
      } else if (dialogMode === "edit" && editingUser) {
        const result = await updateUser({
          id: editingUser.id,
          firstName,
          lastName,
          email,
          password: form.password.trim() || undefined,
          phone: form.phone.trim() || null,
          roleId: form.roleId || undefined,
          status: form.status,
        }).unwrap();
        await setExtraPermissions({
          id: editingUser.id,
          permissions: form.extraPermissions,
        }).unwrap();
        dispatch(toast.success(result.message || "User updated"));
        await refreshCurrentUserIfNeeded(editingUser.id);
      }
      closeDialog(true);
    } catch (err) {
      setFormError(
        rtkError(
          err,
          dialogMode === "create"
            ? "Failed to create user."
            : "Failed to update user.",
        ),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteUser(deleteTarget.id).unwrap();
      dispatch(toast.success(result.message || "User deleted"));
      setDeleteTarget(null);
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to delete user.")));
    }
  }

  async function handleRestore(user: AdminUser) {
    try {
      const result = await restoreUser(user.id).unwrap();
      dispatch(toast.success(result.message || "User restored"));
      if (dialogMode === "edit") populateForm(result.data);
      await refreshCurrentUserIfNeeded(user.id);
    } catch (err) {
      dispatch(toast.error(rtkError(err, "Failed to restore user.")));
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Staff and customers. Extra permissions sit on top of the assigned role."
        action={
          <AdminPrimaryButton onClick={openCreate}>Add user</AdminPrimaryButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full max-w-lg items-center gap-2"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email…"
              className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Search
            </button>
          </form>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-50 disabled:opacity-60"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as UserStatus | "");
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      <AdminPanel
        title={meta ? `${meta.total} user${meta.total === 1 ? "" : "s"}` : "Users"}
      >
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading users…
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

        {!isLoading && !listErrorMessage && users.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {hasActiveFilters
              ? "No users match your filters."
              : "No users yet."}
          </p>
        ) : null}

        {!isLoading && !listErrorMessage && users.length > 0 ? (
          <>
            <AdminTable
              columns={[
                "User",
                "Role",
                "Status",
                "Extras",
                "Effective",
                "Actions",
              ]}
              rows={users.map((user) => [
                <div key={user.id} className="min-w-48">
                  <p className="font-semibold text-brand-950">
                    {displayName(user)}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>,
                user.roleName || user.role || "—",
                <StatusPill
                  key={`${user.id}-status`}
                  label={user.status || "—"}
                  tone={statusTone(user.status)}
                />,
                <PermissionChips
                  key={`${user.id}-extra`}
                  permissions={user.extraPermissions}
                />,
                <PermissionChips
                  key={`${user.id}-effective`}
                  permissions={user.permissions}
                />,
                <div
                  key={`${user.id}-actions`}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => openEdit(user)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                  >
                    Edit
                  </button>
                  {user.deletedAt ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(user)}
                      disabled={isRestoring}
                      className="rounded-lg border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(user)}
                      className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
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
            onClick={() => closeDialog()}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-dialog-title"
            className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <h2
                id="user-dialog-title"
                className="font-display text-lg font-bold text-brand-950"
              >
                {dialogMode === "create" ? "Add user" : "Edit user"}
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

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {isLoadingUser ? (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Loading user details…
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    First name *
                  </span>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Last name *
                  </span>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email *
                  </span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {dialogMode === "create" ? "Password *" : "New password"}
                  </span>
                  <input
                    type="password"
                    required={dialogMode === "create"}
                    minLength={dialogMode === "create" ? 8 : undefined}
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                    placeholder={
                      dialogMode === "edit" ? "Leave blank to keep current" : ""
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Phone
                  </span>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Role
                  </span>
                  <select
                    value={form.roleId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, roleId: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  >
                    <option value="">Default (Customer)</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </span>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value as UserStatus,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </label>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs text-slate-500">
                  Extra permissions are added on top of the role. Changing the
                  role does not remove extras.
                </p>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Role permissions
                  </p>
                  <PermissionChips
                    permissions={rolePermissions}
                    empty="This role grants no permissions"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Extra permissions
                  </p>
                  <PermissionChecklist
                    catalog={catalog}
                    selected={form.extraPermissions}
                    checkedPermissions={rolePermissions}
                    onChange={(permissions) =>
                      setForm((prev) => ({
                        ...prev,
                        extraPermissions: permissions,
                      }))
                    }
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Effective permissions
                  </p>
                  <PermissionChips permissions={effectivePermissions} />
                </div>
              </div>

              {editingUser?.deletedAt ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                  <p className="text-sm text-amber-800">This user is soft-deleted.</p>
                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={() => handleRestore(editingUser)}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                  >
                    {isRestoring ? "Restoring…" : "Restore"}
                  </button>
                </div>
              ) : null}

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
                  disabled={isSaving || isLoadingUser}
                  className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving…"
                    : dialogMode === "create"
                      ? "Create user"
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
            aria-labelledby="delete-user-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-user-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Delete user
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Soft-delete{" "}
              <span className="font-semibold text-brand-950">
                {displayName(deleteTarget)}
              </span>
              ? The last remaining Admin cannot be deleted.
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
