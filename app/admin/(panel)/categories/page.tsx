"use client";

import { useMemo, useState } from "react";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  StatusPill,
} from "@/components/admin/ui";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoryTreeQuery,
  useUpdateCategoryMutation,
  type CategoryTreeNode,
} from "@/app/admin/(panel)/categories/store/categoryAPI";
import { useAppDispatch } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
  isActive: boolean;
  sortOrder: string;
};

type ParentOption = {
  id: string;
  label: string;
  depth: number;
};

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  image: "",
  parentId: "",
  isActive: true,
  sortOrder: "0",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function countNodes(nodes: CategoryTreeNode[]): number {
  return nodes.reduce(
    (sum, node) => sum + 1 + countNodes(node.children ?? []),
    0,
  );
}

function collectDescendantIds(node: CategoryTreeNode): Set<string> {
  const ids = new Set<string>();
  function walk(n: CategoryTreeNode) {
    ids.add(n.id);
    (n.children ?? []).forEach(walk);
  }
  walk(node);
  return ids;
}

function findNode(
  nodes: CategoryTreeNode[],
  id: string,
): CategoryTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

function findParentId(
  nodes: CategoryTreeNode[],
  childId: string,
  parentId: string | null = null,
): string | null | undefined {
  for (const node of nodes) {
    if (node.id === childId) return parentId;
    const found = findParentId(node.children ?? [], childId, node.id);
    if (found !== undefined) return found;
  }
  return undefined;
}

function flattenForSelect(
  nodes: CategoryTreeNode[],
  excludeIds: Set<string> = new Set(),
  depth = 0,
): ParentOption[] {
  const options: ParentOption[] = [];
  for (const node of nodes) {
    if (excludeIds.has(node.id)) continue;
    const prefix = depth > 0 ? `${"— ".repeat(depth)}` : "";
    options.push({
      id: node.id,
      label: `${prefix}${node.name}`,
      depth,
    });
    options.push(
      ...flattenForSelect(node.children ?? [], excludeIds, depth + 1),
    );
  }
  return options;
}

function filterTree(
  nodes: CategoryTreeNode[],
  search: string,
  activeOnly: boolean | null,
): CategoryTreeNode[] {
  const query = search.trim().toLowerCase();

  return nodes
    .map((node) => {
      const children = filterTree(node.children ?? [], search, activeOnly);
      const matchesSearch =
        !query ||
        node.name.toLowerCase().includes(query) ||
        node.slug.toLowerCase().includes(query) ||
        (node.description ?? "").toLowerCase().includes(query);
      const matchesActive =
        activeOnly === null || node.isActive === activeOnly;

      if ((matchesSearch && matchesActive) || children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter((node): node is CategoryTreeNode => node !== null);
}

function collectExpandableIds(nodes: CategoryTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if ((node.children ?? []).length > 0) {
      ids.push(node.id);
      ids.push(...collectExpandableIds(node.children ?? []));
    }
  }
  return ids;
}

function CategoryTreeRows({
  nodes,
  depth,
  expandedIds,
  parentId,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: {
  nodes: CategoryTreeNode[];
  depth: number;
  expandedIds: Set<string>;
  parentId: string | null;
  onToggle: (id: string) => void;
  onAddChild: (parent: CategoryTreeNode) => void;
  onEdit: (node: CategoryTreeNode, parentId: string | null) => void;
  onDelete: (node: CategoryTreeNode) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const children = node.children ?? [];
        const hasChildren = children.length > 0;
        const isExpanded = expandedIds.has(node.id);

        return (
          <div key={node.id}>
            <div
              className="group flex flex-col gap-3 border-b border-slate-50 py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              style={{ paddingLeft: `${depth * 1.25 + 0.25}rem` }}
            >
              <div className="flex min-w-0 items-start gap-2">
                {hasChildren ? (
                  <button
                    type="button"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    onClick={() => onToggle(node.id)}
                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-brand-50"
                  >
                    <span className="text-xs font-bold">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>
                ) : (
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center text-slate-300">
                    ·
                  </span>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-brand-950">
                      {node.name}
                    </span>
                    <StatusPill
                      label={node.isActive ? "Active" : "Inactive"}
                      tone={node.isActive ? "success" : "danger"}
                    />
                    {hasChildren ? (
                      <span className="text-xs text-slate-400">
                        {children.length} child
                        {children.length === 1 ? "" : "ren"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    {node.slug}
                  </p>
                  {node.description?.trim() ? (
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                      {node.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:pl-9">
                <button
                  type="button"
                  onClick={() => onAddChild(node)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                >
                  Add child
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(node, parentId)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(node)}
                  className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {hasChildren && isExpanded ? (
              <CategoryTreeRows
                nodes={children}
                depth={depth + 1}
                expandedIds={expandedIds}
                parentId={node.id}
                onToggle={onToggle}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export default function AdminCategoriesPage() {
  const dispatch = useAppDispatch();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  /** null = expand all by default until the user changes it */
  const [expandedIds, setExpandedIds] = useState<Set<string> | null>(null);

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingNode, setEditingNode] = useState<CategoryTreeNode | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryTreeNode | null>(
    null,
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCategoryTreeQuery();

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  const tree = useMemo(() => data?.data ?? [], [data?.data]);
  const isSaving = isCreating || isUpdating;

  const listErrorMessage = useMemo(() => {
    if (!isError) return null;
    return getErrorMessage(error, "Failed to load categories.");
  }, [error, isError]);

  const activeOnly = activeFilter === "" ? null : activeFilter === "true";

  const filteredTree = useMemo(
    () => filterTree(tree, search, activeOnly),
    [tree, search, activeOnly],
  );

  const totalCount = countNodes(tree);
  const visibleCount = countNodes(filteredTree);

  const defaultExpandedIds = useMemo(
    () => new Set(collectExpandableIds(tree)),
    [tree],
  );
  const resolvedExpandedIds = expandedIds ?? defaultExpandedIds;

  const parentOptions = useMemo(() => {
    const excludeIds = new Set<string>();
    if (dialogMode === "edit" && editingNode) {
      collectDescendantIds(editingNode).forEach((id) => excludeIds.add(id));
    }
    return flattenForSelect(tree, excludeIds);
  }, [tree, dialogMode, editingNode]);

  function openCreate(parentId: string | null = null) {
    setDialogMode("create");
    setEditingNode(null);
    setForm({
      ...emptyForm,
      parentId: parentId ?? "",
    });
    setSlugTouched(false);
    setFormError(null);
  }

  function openEdit(node: CategoryTreeNode, parentId: string | null) {
    const resolvedParentId =
      parentId ?? findParentId(tree, node.id) ?? null;

    setDialogMode("edit");
    setEditingNode(node);
    setForm({
      name: node.name,
      slug: node.slug,
      description: node.description ?? "",
      image: node.image ?? "",
      parentId: resolvedParentId ?? "",
      isActive: node.isActive,
      sortOrder: String(node.sortOrder ?? 0),
    });
    setSlugTouched(true);
    setFormError(null);
  }

  function closeDialog(force = false) {
    if (isSaving && !force) return;
    setDialogMode(null);
    setEditingNode(null);
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
    setSearch(searchInput.trim());
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev ?? defaultExpandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(collectExpandableIds(filteredTree)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      setFormError("Sort order must be a number.");
      return;
    }

    const parentId = form.parentId.trim() ? form.parentId.trim() : null;

    try {
      if (dialogMode === "create") {
        const result = await createCategory({
          name,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          image: form.image.trim() || null,
          parentId,
          isActive: form.isActive,
          sortOrder,
        }).unwrap();
        dispatch(
          toast.success(result.message || "Category created successfully"),
        );
        if (parentId) {
          setExpandedIds((prev) => {
            const next = new Set(prev ?? defaultExpandedIds);
            next.add(parentId);
            return next;
          });
        }
      } else if (dialogMode === "edit" && editingNode) {
        const result = await updateCategory({
          id: editingNode.id,
          name,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          image: form.image.trim() || null,
          parentId,
          isActive: form.isActive,
          sortOrder,
        }).unwrap();
        dispatch(
          toast.success(result.message || "Category updated successfully"),
        );
      }
      closeDialog(true);
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          dialogMode === "create"
            ? "Failed to create category."
            : "Failed to update category.",
        ),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteCategory(deleteTarget.id).unwrap();
      dispatch(
        toast.success(result.message || "Category deleted successfully"),
      );
      setDeleteTarget(null);
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to delete category.")),
      );
    }
  }

  const dialogTitle =
    dialogMode === "create"
      ? form.parentId
        ? "Add subcategory"
        : "Add category"
      : "Edit category";

  const parentLabel = form.parentId
    ? findNode(tree, form.parentId)?.name
    : null;

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="Organize products into nested storefront categories."
        action={
          <AdminPrimaryButton onClick={() => openCreate(null)}>
            Add category
          </AdminPrimaryButton>
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
          <button
            type="button"
            onClick={expandAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-950 hover:bg-brand-50"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-950 hover:bg-brand-50"
          >
            Collapse all
          </button>
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
          search || activeFilter
            ? `${visibleCount} of ${totalCount} categor${totalCount === 1 ? "y" : "ies"}`
            : `${totalCount} categor${totalCount === 1 ? "y" : "ies"}`
        }
      >
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading categories…
          </p>
        ) : null}

        {!isLoading && listErrorMessage ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-red-700">
              {listErrorMessage}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 text-sm font-semibold text-brand-800 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !listErrorMessage && filteredTree.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {search || activeFilter
              ? "No categories match your filters."
              : "No categories yet. Add a root category to get started."}
          </p>
        ) : null}

        {!isLoading && !listErrorMessage && filteredTree.length > 0 ? (
          <div className="-mx-1">
            <CategoryTreeRows
              nodes={filteredTree}
              depth={0}
              expandedIds={resolvedExpandedIds}
              parentId={null}
              onToggle={toggleExpanded}
              onAddChild={(parent) => openCreate(parent.id)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
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
            aria-labelledby="category-dialog-title"
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2
                  id="category-dialog-title"
                  className="font-display text-lg font-bold text-brand-950"
                >
                  {dialogTitle}
                </h2>
                {dialogMode === "create" && parentLabel ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Under <span className="font-semibold">{parentLabel}</span>
                  </p>
                ) : null}
              </div>
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
                  placeholder="Electronics"
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
                  placeholder="electronics"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Parent category
                </span>
                <select
                  value={form.parentId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, parentId: e.target.value }))
                  }
                  className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                >
                  <option value="">None (root category)</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-slate-400">
                  Nest this category under another, or leave as root.
                </span>
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
                  placeholder="Devices, gadgets, and accessories"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Image URL
                </span>
                <input
                  value={form.image}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, image: e.target.value }))
                  }
                  className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  placeholder="https://cdn.example.com/categories/electronics.png"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sort order
                  </span>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  />
                </label>

                <label className="flex flex-col">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </span>
                  <label className="mt-auto flex items-center gap-2 rounded-xl border-2 border-brand-900/10 px-4 py-2.5 text-sm">
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
                </label>
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
                      ? "Create category"
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
            aria-labelledby="delete-category-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-category-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Delete category
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete{" "}
              <span className="font-semibold text-brand-950">
                {deleteTarget.name}
              </span>
              {(deleteTarget.children ?? []).length > 0
                ? ` and its ${(deleteTarget.children ?? []).length} nested categor${(deleteTarget.children ?? []).length === 1 ? "y" : "ies"}`
                : ""}
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
