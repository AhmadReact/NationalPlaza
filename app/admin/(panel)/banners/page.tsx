"use client";

import { useMemo, useState } from "react";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  StatusPill,
} from "@/components/admin/ui";
import { SortableList } from "@/components/admin/sortable-list";
import {
  BannerFormDialog,
  type BannerFormSubmitPayload,
} from "@/app/admin/(panel)/banners/banner-form-dialog";
import {
  BANNER_LINK_LABEL,
  BANNER_PLACEMENT_LABEL,
  useCreateBannerMutation,
  useDeleteBannerMutation,
  useDeleteBannerMobileImageMutation,
  useGetAdminBannersQuery,
  useReorderBannersMutation,
  useUpdateBannerMutation,
  useUploadBannerImageMutation,
  useUploadBannerMobileImageMutation,
  type Banner,
  type BannerPlacement,
} from "@/app/admin/(panel)/banners/store/bannerAPI";
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

function formatSchedule(banner: Banner): string {
  if (!banner.startsAt && !banner.endsAt) return "Always";
  const format = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  if (banner.startsAt && banner.endsAt) {
    return `${format(banner.startsAt)} – ${format(banner.endsAt)}`;
  }
  if (banner.startsAt) return `From ${format(banner.startsAt)}`;
  return `Until ${format(banner.endsAt!)}`;
}

function linkSummary(banner: Banner): string {
  if (banner.href) return banner.href;
  if (banner.linkType === "PRODUCT") {
    return banner.product?.name ?? "Product";
  }
  if (banner.linkType === "CATEGORY") {
    return banner.category?.name ?? "Category";
  }
  return BANNER_LINK_LABEL[banner.linkType];
}

export default function AdminBannersPage() {
  const dispatch = useAppDispatch();
  const [placementFilter, setPlacementFilter] = useState<BannerPlacement | "">(
    "",
  );
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [draftOrder, setDraftOrder] = useState<{
    key: string;
    items: Banner[];
  } | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAdminBannersQuery({
      placement: placementFilter || undefined,
      isActive:
        activeFilter === "true"
          ? true
          : activeFilter === "false"
            ? false
            : undefined,
    });

  const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
  const [reorderBanners, { isLoading: isReordering }] =
    useReorderBannersMutation();
  const [uploadImage] = useUploadBannerImageMutation();
  const [uploadMobileImage] = useUploadBannerMobileImageMutation();
  const [deleteMobileImage] = useDeleteBannerMobileImageMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();

  const apiBanners = useMemo(() => {
    const items = [...(data?.data ?? [])];
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return items;
  }, [data]);

  const apiKey = apiBanners
    .map((banner) => `${banner.id}:${banner.sortOrder}`)
    .join("|");
  const banners =
    draftOrder && draftOrder.key === apiKey ? draftOrder.items : apiBanners;
  const saving = isCreating || isUpdating;
  const listError = isError
    ? getErrorMessage(error, "Failed to load banners.")
    : null;

  function openCreate() {
    setDialogMode("create");
    setEditingBanner(null);
    setFormError(null);
  }

  function openEdit(banner: Banner) {
    setDialogMode("edit");
    setEditingBanner(banner);
    setFormError(null);
  }

  function closeDialog() {
    if (saving) return;
    setDialogMode(null);
    setEditingBanner(null);
    setFormError(null);
  }

  async function persistImages(
    id: string,
    payload: BannerFormSubmitPayload,
  ) {
    if (payload.desktopFile) {
      await uploadImage({ id, image: payload.desktopFile }).unwrap();
    }
    if (payload.mobileFile) {
      await uploadMobileImage({ id, image: payload.mobileFile }).unwrap();
    } else if (payload.removeMobile) {
      await deleteMobileImage(id).unwrap();
    }
  }

  async function handleSubmit(payload: BannerFormSubmitPayload) {
    setFormError(null);
    try {
      if (dialogMode === "create") {
        const created = await createBanner(payload.body).unwrap();
        const id = created.data.id;
        try {
          await persistImages(id, payload);
        } catch (imageError) {
          setEditingBanner(created.data);
          setDialogMode("edit");
          setFormError(
            getErrorMessage(
              imageError,
              "Banner saved, but image upload failed. Try uploading again.",
            ),
          );
          return;
        }
        dispatch(toast.success(created.message || "Banner created"));
      } else if (dialogMode === "edit" && editingBanner) {
        const updated = await updateBanner({
          id: editingBanner.id,
          ...payload.body,
        }).unwrap();
        await persistImages(editingBanner.id, payload);
        dispatch(toast.success(updated.message || "Banner updated"));
      }
      closeDialog();
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          dialogMode === "create"
            ? "Failed to create banner."
            : "Failed to update banner.",
        ),
      );
    }
  }

  async function handleReorder(nextItems: Banner[]) {
    setDraftOrder({ key: apiKey, items: nextItems });
    try {
      await reorderBanners({
        items: nextItems.map((banner, index) => ({
          id: banner.id,
          sortOrder: index,
        })),
      }).unwrap();
      dispatch(toast.success("Banner order updated"));
    } catch (err) {
      setDraftOrder(null);
      dispatch(toast.error(getErrorMessage(err, "Failed to reorder banners.")));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteBanner(deleteTarget.id).unwrap();
      dispatch(toast.success(result.message || "Banner deleted"));
      setDeleteTarget(null);
    } catch (err) {
      dispatch(toast.error(getErrorMessage(err, "Failed to delete banner.")));
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Banners"
        description="Promo placements for home, category, and product pages."
        action={
          <AdminPrimaryButton onClick={openCreate}>
            Add banner
          </AdminPrimaryButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={placementFilter}
            onChange={(e) =>
              setPlacementFilter(e.target.value as BannerPlacement | "")
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All placements</option>
            {(Object.keys(BANNER_PLACEMENT_LABEL) as BannerPlacement[]).map(
              (key) => (
                <option key={key} value={key}>
                  {BANNER_PLACEMENT_LABEL[key]}
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
        title={`${banners.length} banner${banners.length === 1 ? "" : "s"}`}
      >
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading banners…
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

        {!isLoading && !listError && banners.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No banners yet. Add your first promo banner to get started.
          </p>
        ) : null}

        {!isLoading && !listError && banners.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              {placementFilter
                ? "Drag to change the order for this placement."
                : "Filter by placement to reorder a specific slot, or drag to set a global order."}
            </p>
            <SortableList
              items={banners}
              disabled={isReordering}
              className="space-y-2"
              onReorder={handleReorder}
              renderItem={(banner) => (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  {banner.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.imageUrl}
                      alt=""
                      className="h-14 w-24 rounded-lg border border-slate-100 object-cover"
                    />
                  ) : (
                    <span className="grid h-14 w-24 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                      No image
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-brand-950">
                      {banner.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {BANNER_PLACEMENT_LABEL[banner.placement]} ·{" "}
                      {linkSummary(banner)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatSchedule(banner)} · sort {banner.sortOrder}
                    </p>
                  </div>
                  <StatusPill
                    label={banner.isActive ? "Active" : "Inactive"}
                    tone={banner.isActive ? "success" : "danger"}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(banner)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(banner)}
                      className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        ) : null}
      </AdminPanel>

      {dialogMode ? (
        <BannerFormDialog
          key={dialogMode === "edit" ? (editingBanner?.id ?? "edit") : "create"}
          mode={dialogMode}
          banner={editingBanner}
          saving={saving}
          error={formError}
          onClose={closeDialog}
          onSubmit={handleSubmit}
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
            aria-labelledby="delete-banner-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-banner-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Delete banner
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete{" "}
              <span className="font-semibold text-brand-950">
                {deleteTarget.title}
              </span>
              ? This also removes stored images and cannot be undone.
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
