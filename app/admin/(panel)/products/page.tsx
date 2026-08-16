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
  useBulkCreateProductSpecificationsMutation,
  useCreateProductMutation,
  useCreateProductSpecificationMutation,
  useDeleteProductImageMutation,
  useDeleteProductMutation,
  useDeleteProductSpecificationMutation,
  useGetProductsQuery,
  useLazyGetProductByIdQuery,
  useLazyGetProductImagesQuery,
  useLazyGetProductSpecificationsQuery,
  useReorderProductImagesMutation,
  useReorderProductSpecificationsMutation,
  useReplaceProductSpecificationsMutation,
  useSetProductThumbnailMutation,
  useUpdateProductImageMutation,
  useUpdateProductMutation,
  useUpdateProductSpecificationMutation,
  useUploadProductImagesMutation,
  type Product,
  type ProductImage,
  type ProductSpecification,
  type ProductStatus,
} from "@/app/admin/(panel)/products/store/productAPI";
import { useGetBrandsQuery } from "@/app/admin/(panel)/brands/store/brandAPI";
import {
  useGetCategoryAttributesQuery,
  useGetCategoryTreeQuery,
  type CategoryTreeNode,
} from "@/app/admin/(panel)/categories/store/categoryAPI";
import { formatPrice } from "@/lib/data";
import { useAppDispatch } from "@/lib/store/hooks";
import { toast } from "@/lib/store/snackbarSlice";
import { SortableList } from "@/components/admin/sortable-list";
import {
  ProductFilterFields,
  selectionsFromAttributeValues,
  toAttributeWritePayload,
} from "@/app/admin/(panel)/products/product-filter-fields";

type SpecRow = { name: string; value: string };

type ProductFormState = {
  name: string;
  sku: string;
  slug: string;
  barcode: string;
  description: string;
  brandId: string;
  categoryId: string;
  price: string;
  salePrice: string;
  costPrice: string;
  stock: string;
  lowStock: string;
  isFeatured: boolean;
  status: ProductStatus;
  images: File[];
  specs: SpecRow[];
  attributeValues: Record<string, string[]>;
};

const emptyForm: ProductFormState = {
  name: "",
  sku: "",
  slug: "",
  barcode: "",
  description: "",
  brandId: "",
  categoryId: "",
  price: "",
  salePrice: "",
  costPrice: "",
  stock: "0",
  lowStock: "5",
  isFeatured: false,
  status: "ACTIVE",
  images: [],
  specs: [],
  attributeValues: {},
};

const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const MAX_UPLOAD_FILES = 8;

type CategoryOption = { id: string; label: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function statusTone(status?: ProductStatus | string) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "active") return "success" as const;
  if (normalized === "inactive") return "danger" as const;
  return "info" as const;
}

function displayPrice(product: Product): string {
  if (product.salePrice != null && product.salePrice < product.price) {
    return formatPrice(product.salePrice);
  }
  return formatPrice(product.price);
}

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
        .map((e) =>
          e.field ? `${e.field}: ${e.message ?? ""}` : (e.message ?? ""),
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

function flattenCategories(
  nodes: CategoryTreeNode[],
  depth = 0,
): CategoryOption[] {
  const options: CategoryOption[] = [];
  for (const node of nodes) {
    const prefix = depth > 0 ? `${"— ".repeat(depth)}` : "";
    options.push({ id: node.id, label: `${prefix}${node.name}` });
    options.push(...flattenCategories(node.children ?? [], depth + 1));
  }
  return options;
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : Number.NaN;
}

function parseOptionalNullableNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : Number.NaN;
}

export default function AdminProductsPage() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState<"" | "true" | "false">(
    "",
  );
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const limit = 20;

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageAltDrafts, setImageAltDrafts] = useState<Record<string, string>>(
    {},
  );
  const [savingAltImageId, setSavingAltImageId] = useState<string | null>(null);
  const [specDrafts, setSpecDrafts] = useState<
    Record<string, { name: string; value: string }>
  >({});
  const [newSpecRows, setNewSpecRows] = useState<SpecRow[]>([]);
  const [savingSpecId, setSavingSpecId] = useState<string | null>(null);
  const [categoryChangedWarning, setCategoryChangedWarning] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetProductsQuery({
      page,
      limit,
      search: search || undefined,
      status: statusFilter || undefined,
      brandId: brandFilter || undefined,
      categoryId: categoryFilter || undefined,
      isFeatured: featuredFilter === "" ? undefined : featuredFilter === "true",
      lowStockOnly: lowStockOnly || undefined,
    });

  const { data: brandsData } = useGetBrandsQuery({ page: 1, limit: 100 });
  const { data: categoryTreeData } = useGetCategoryTreeQuery();
  const { data: categoryAttributesData } = useGetCategoryAttributesQuery(
    form.categoryId,
    { skip: !form.categoryId || !dialogMode },
  );

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [fetchProductById] = useLazyGetProductByIdQuery();
  const [uploadImages, { isLoading: isUploading }] =
    useUploadProductImagesMutation();
  const [fetchProductImages] = useLazyGetProductImagesQuery();
  const [reorderImages, { isLoading: isReorderingImages }] =
    useReorderProductImagesMutation();
  const [updateImage, { isLoading: isUpdatingImage }] =
    useUpdateProductImageMutation();
  const [deleteImage, { isLoading: isDeletingImage }] =
    useDeleteProductImageMutation();
  const [setThumbnail, { isLoading: isSettingThumbnail }] =
    useSetProductThumbnailMutation();
  const [fetchProductSpecs] = useLazyGetProductSpecificationsQuery();
  const [createSpec, { isLoading: isCreatingSpec }] =
    useCreateProductSpecificationMutation();
  const [bulkCreateSpecs, { isLoading: isBulkCreatingSpecs }] =
    useBulkCreateProductSpecificationsMutation();
  const [replaceSpecs, { isLoading: isReplacingSpecs }] =
    useReplaceProductSpecificationsMutation();
  const [reorderSpecs, { isLoading: isReorderingSpecs }] =
    useReorderProductSpecificationsMutation();
  const [updateSpec, { isLoading: isUpdatingSpec }] =
    useUpdateProductSpecificationMutation();
  const [deleteSpec, { isLoading: isDeletingSpec }] =
    useDeleteProductSpecificationMutation();

  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const products = data?.data ?? [];
  const meta = data?.meta;
  const brands = brandsData?.data ?? [];
  const categoryOptions = useMemo(
    () => flattenCategories(categoryTreeData?.data ?? []),
    [categoryTreeData?.data],
  );

  const isSaving =
    isCreating ||
    isUpdating ||
    isUploading ||
    isReplacingSpecs ||
    isDeletingImage ||
    isSettingThumbnail ||
    isReorderingImages ||
    isUpdatingImage ||
    isCreatingSpec ||
    isBulkCreatingSpecs ||
    isReorderingSpecs ||
    isUpdatingSpec ||
    isDeletingSpec;

  const listErrorMessage = useMemo(() => {
    if (!isError) return null;
    return getErrorMessage(error, "Failed to load products.");
  }, [error, isError]);

  const hasActiveFilters = Boolean(
    search ||
    statusFilter ||
    brandFilter ||
    categoryFilter ||
    featuredFilter ||
    lowStockOnly,
  );

  function clearImagePreviews() {
    setImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  }

  function setSelectedImages(files: File[]) {
    setImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.map((file) => URL.createObjectURL(file));
    });
    setForm((prev) => ({ ...prev, images: files }));
  }

  function openCreate() {
    setDialogMode("create");
    setEditingProduct(null);
    clearImagePreviews();
    setImageAltDrafts({});
    setSavingAltImageId(null);
    setSpecDrafts({});
    setNewSpecRows([]);
    setSavingSpecId(null);
    setCategoryChangedWarning(false);
    setForm(emptyForm);
    setSlugTouched(false);
    setFormError(null);
  }

  function syncImageState(images: ProductImage[]) {
    const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
    setEditingProduct((prev) =>
      prev
        ? {
            ...prev,
            images: sorted,
            thumbnail: sorted.find((img) => img.isThumbnail) ?? null,
          }
        : prev,
    );
    setImageAltDrafts(
      Object.fromEntries(sorted.map((img) => [img.id, img.alt ?? ""])),
    );
  }

  function syncSpecState(specs: ProductSpecification[]) {
    const sorted = [...specs].sort((a, b) => a.sortOrder - b.sortOrder);
    setEditingProduct((prev) =>
      prev ? { ...prev, specifications: sorted } : prev,
    );
    setSpecDrafts(
      Object.fromEntries(
        sorted.map((spec) => [
          spec.id,
          { name: spec.name, value: spec.value },
        ]),
      ),
    );
  }

  function populateForm(product: Product) {
    setEditingProduct(product);
    clearImagePreviews();
    setImageAltDrafts(
      Object.fromEntries(
        (product.images ?? []).map((img) => [img.id, img.alt ?? ""]),
      ),
    );
    setSpecDrafts(
      Object.fromEntries(
        (product.specifications ?? []).map((spec) => [
          spec.id,
          { name: spec.name, value: spec.value },
        ]),
      ),
    );
    setNewSpecRows([]);
    setForm({
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      barcode: product.barcode ?? "",
      description: product.description ?? "",
      brandId: product.brandId,
      categoryId: product.categoryId,
      price: String(product.price),
      salePrice: product.salePrice != null ? String(product.salePrice) : "",
      costPrice: product.costPrice != null ? String(product.costPrice) : "",
      stock: String(product.stock ?? 0),
      lowStock: String(product.lowStock ?? 5),
      isFeatured: product.isFeatured,
      status: product.status || "ACTIVE",
      images: [],
      specs: [],
      attributeValues: selectionsFromAttributeValues(product.attributeValues),
    });
    setSlugTouched(true);
    setFormError(null);
    setCategoryChangedWarning(false);
  }

  async function openEdit(product: Product) {
    setDialogMode("edit");
    populateForm(product);
    setIsLoadingProduct(true);
    try {
      const result = await fetchProductById(product.id).unwrap();
      populateForm(result.data);
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Could not load full product details."),
      );
    } finally {
      setIsLoadingProduct(false);
    }
  }

  function closeDialog(force = false) {
    if (isSaving && !force) return;
    setDialogMode(null);
    setEditingProduct(null);
    clearImagePreviews();
    setImageAltDrafts({});
    setSavingAltImageId(null);
    setSpecDrafts({});
    setNewSpecRows([]);
    setSavingSpecId(null);
    setCategoryChangedWarning(false);
    setForm(emptyForm);
    setSlugTouched(false);
    setFormError(null);
  }

  async function refreshProductImages(productId: string) {
    const result = await fetchProductImages(productId).unwrap();
    syncImageState(result.data ?? []);
  }

  async function refreshProductSpecs(productId: string) {
    const result = await fetchProductSpecs(productId).unwrap();
    syncSpecState(result.data ?? []);
  }

  function handleCategoryChange(nextCategoryId: string) {
    setForm((prev) => {
      const hadValues = Object.values(prev.attributeValues).some(
        (ids) => ids.length > 0,
      );
      if (prev.categoryId && nextCategoryId !== prev.categoryId && hadValues) {
        setCategoryChangedWarning(true);
      } else if (nextCategoryId === prev.categoryId) {
        setCategoryChangedWarning(false);
      }
      return {
        ...prev,
        categoryId: nextCategoryId,
        attributeValues:
          nextCategoryId === prev.categoryId ? prev.attributeValues : {},
      };
    });
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

  function validateForm(): string | null {
    const name = form.name.trim();
    if (name.length < 2) return "Name must be at least 2 characters.";

    const sku = form.sku.trim();
    if (sku.length < 2) return "SKU must be at least 2 characters.";
    if (!SKU_PATTERN.test(sku)) {
      return "SKU may only contain letters, numbers, dots, underscores, and hyphens.";
    }

    if (!form.brandId) return "Brand is required.";
    if (!form.categoryId) return "Category is required.";

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      return "Price must be a number ≥ 0.";
    }

    const salePrice = parseOptionalNumber(form.salePrice);
    if (salePrice !== undefined && Number.isNaN(salePrice)) {
      return "Sale price must be a valid number.";
    }
    if (salePrice !== undefined && salePrice > price) {
      return "Sale price must be ≤ price.";
    }

    const costPrice = parseOptionalNumber(form.costPrice);
    if (costPrice !== undefined && Number.isNaN(costPrice)) {
      return "Cost price must be a valid number.";
    }

    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return "Stock must be an integer ≥ 0.";
    }

    const lowStock = Number(form.lowStock);
    if (!Number.isInteger(lowStock) || lowStock < 0) {
      return "Low stock threshold must be an integer ≥ 0.";
    }

    if (form.images.length > MAX_UPLOAD_FILES) {
      return `You can upload at most ${MAX_UPLOAD_FILES} images at a time.`;
    }

    const requiredAttributes = (categoryAttributesData?.data ?? []).filter(
      (attribute) => attribute.isRequired,
    );
    for (const attribute of requiredAttributes) {
      if ((form.attributeValues[attribute.id] ?? []).length === 0) {
        return `${attribute.name} is required.`;
      }
    }

    if (dialogMode === "create") {
      for (const [index, spec] of form.specs.entries()) {
        const hasName = spec.name.trim().length > 0;
        const hasValue = spec.value.trim().length > 0;
        if (hasName !== hasValue) {
          return `Specification #${index + 1} needs both a name and a value.`;
        }
      }
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const name = form.name.trim();
    const sku = form.sku.trim();
    const price = Number(form.price);
    const salePrice = parseOptionalNumber(form.salePrice);
    const costPrice = parseOptionalNumber(form.costPrice);
    const stock = Number(form.stock);
    const lowStock = Number(form.lowStock);
    const attributeValues = toAttributeWritePayload(form.attributeValues);

    try {
      if (dialogMode === "create") {
        const result = await createProduct({
          name,
          sku,
          brandId: form.brandId,
          categoryId: form.categoryId,
          price,
          slug: form.slug.trim() || undefined,
          barcode: form.barcode.trim() || undefined,
          description: form.description.trim() || undefined,
          salePrice,
          costPrice,
          stock,
          lowStock,
          isFeatured: form.isFeatured,
          status: form.status,
          attributeValues,
        }).unwrap();

        const productId = result.data.id;

        if (form.images.length > 0) {
          await uploadImages({
            productId,
            images: form.images,
          }).unwrap();
        }

        const draftSpecs = form.specs
          .map((spec, index) => ({
            name: spec.name.trim(),
            value: spec.value.trim(),
            sortOrder: index,
          }))
          .filter((spec) => spec.name && spec.value);

        if (draftSpecs.length === 1) {
          await createSpec({
            productId,
            name: draftSpecs[0].name,
            value: draftSpecs[0].value,
            sortOrder: 0,
          }).unwrap();
        } else if (draftSpecs.length > 1) {
          await bulkCreateSpecs({
            productId,
            items: draftSpecs,
          }).unwrap();
        }

        dispatch(
          toast.success(result.message || "Product created successfully"),
        );
      } else if (dialogMode === "edit" && editingProduct) {
        const salePriceValue = parseOptionalNullableNumber(form.salePrice);
        const costPriceValue = parseOptionalNullableNumber(form.costPrice);

        const result = await updateProduct({
          id: editingProduct.id,
          name,
          sku,
          brandId: form.brandId,
          categoryId: form.categoryId,
          price,
          slug: form.slug.trim() || undefined,
          barcode: form.barcode.trim() || null,
          description: form.description.trim() || null,
          salePrice: salePriceValue,
          costPrice: costPriceValue,
          stock,
          lowStock,
          isFeatured: form.isFeatured,
          status: form.status,
          attributeValues,
        }).unwrap();

        if (form.images.length > 0) {
          await uploadImages({
            productId: editingProduct.id,
            images: form.images,
          }).unwrap();
        }

        dispatch(
          toast.success(result.message || "Product updated successfully"),
        );
      }

      closeDialog(true);
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          dialogMode === "create"
            ? "Failed to create product."
            : "Failed to update product.",
        ),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteProduct(deleteTarget.id).unwrap();
      dispatch(toast.success(result.message || "Product deleted successfully"));
      setDeleteTarget(null);
    } catch (err) {
      dispatch(toast.error(getErrorMessage(err, "Failed to delete product.")));
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!editingProduct) return;
    try {
      await deleteImage({
        productId: editingProduct.id,
        imageId,
      }).unwrap();
      await refreshProductImages(editingProduct.id);
      dispatch(toast.success("Image deleted"));
    } catch (err) {
      dispatch(toast.error(getErrorMessage(err, "Failed to delete image.")));
    }
  }

  async function handleSetThumbnail(imageId: string) {
    if (!editingProduct) return;
    try {
      await setThumbnail({
        productId: editingProduct.id,
        imageId,
      }).unwrap();
      await refreshProductImages(editingProduct.id);
      dispatch(toast.success("Thumbnail updated"));
    } catch (err) {
      dispatch(toast.error(getErrorMessage(err, "Failed to set thumbnail.")));
    }
  }

  async function handleReorderImages(nextImages: ProductImage[]) {
    if (!editingProduct) return;

    syncImageState(
      nextImages.map((img, sortOrder) => ({ ...img, sortOrder })),
    );

    const items = nextImages.map((img, sortOrder) => ({
      id: img.id,
      sortOrder,
    }));

    try {
      const result = await reorderImages({
        productId: editingProduct.id,
        items,
      }).unwrap();
      syncImageState(
        result.data ??
          nextImages.map((img, sortOrder) => ({ ...img, sortOrder })),
      );
      dispatch(toast.success("Image order updated"));
    } catch (err) {
      await refreshProductImages(editingProduct.id).catch(() => undefined);
      dispatch(toast.error(getErrorMessage(err, "Failed to reorder images.")));
    }
  }

  async function handleSaveImageAlt(imageId: string) {
    if (!editingProduct) return;
    const alt = (imageAltDrafts[imageId] ?? "").trim();
    setSavingAltImageId(imageId);
    try {
      const result = await updateImage({
        productId: editingProduct.id,
        imageId,
        alt: alt || undefined,
      }).unwrap();
      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              images: prev.images.map((img) =>
                img.id === imageId ? { ...img, ...result.data } : img,
              ),
            }
          : prev,
      );
      setImageAltDrafts((prev) => ({
        ...prev,
        [imageId]: result.data.alt ?? "",
      }));
      dispatch(toast.success("Image alt text saved"));
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to update image metadata.")),
      );
    } finally {
      setSavingAltImageId(null);
    }
  }

  async function handleSaveSpec(specificationId: string) {
    if (!editingProduct) return;
    const draft = specDrafts[specificationId];
    const name = draft?.name.trim() ?? "";
    const value = draft?.value.trim() ?? "";
    if (!name || !value) {
      dispatch(toast.error("Spec name and value are required."));
      return;
    }
    setSavingSpecId(specificationId);
    try {
      const result = await updateSpec({
        productId: editingProduct.id,
        specificationId,
        name,
        value,
      }).unwrap();
      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              specifications: prev.specifications.map((spec) =>
                spec.id === specificationId ? result.data : spec,
              ),
            }
          : prev,
      );
      setSpecDrafts((prev) => ({
        ...prev,
        [specificationId]: {
          name: result.data.name,
          value: result.data.value,
        },
      }));
      dispatch(toast.success("Specification updated"));
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to update specification.")),
      );
    } finally {
      setSavingSpecId(null);
    }
  }

  async function handleDeleteSpec(specificationId: string) {
    if (!editingProduct) return;
    try {
      await deleteSpec({
        productId: editingProduct.id,
        specificationId,
      }).unwrap();
      await refreshProductSpecs(editingProduct.id);
      dispatch(toast.success("Specification deleted"));
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to delete specification.")),
      );
    }
  }

  async function handleReorderSpecs(nextSpecs: ProductSpecification[]) {
    if (!editingProduct) return;

    syncSpecState(
      nextSpecs.map((spec, sortOrder) => ({ ...spec, sortOrder })),
    );

    const items = nextSpecs.map((spec, sortOrder) => ({
      id: spec.id,
      sortOrder,
    }));

    try {
      const result = await reorderSpecs({
        productId: editingProduct.id,
        items,
      }).unwrap();
      syncSpecState(
        result.data ??
          nextSpecs.map((spec, sortOrder) => ({ ...spec, sortOrder })),
      );
      dispatch(toast.success("Specification order updated"));
    } catch (err) {
      await refreshProductSpecs(editingProduct.id).catch(() => undefined);
      dispatch(
        toast.error(getErrorMessage(err, "Failed to reorder specifications.")),
      );
    }
  }

  async function handleBulkAddSpecs() {
    if (!editingProduct) return;
    const items = newSpecRows
      .map((row, index) => ({
        name: row.name.trim(),
        value: row.value.trim(),
        sortOrder: (editingProduct.specifications?.length ?? 0) + index,
      }))
      .filter((row) => row.name && row.value);

    if (items.length === 0) {
      dispatch(toast.error("Add at least one complete spec row."));
      return;
    }
    if (items.length !== newSpecRows.length) {
      dispatch(toast.error("Each new spec needs both a name and a value."));
      return;
    }

    try {
      if (items.length === 1) {
        await createSpec({
          productId: editingProduct.id,
          name: items[0].name,
          value: items[0].value,
          sortOrder: items[0].sortOrder,
        }).unwrap();
      } else {
        await bulkCreateSpecs({
          productId: editingProduct.id,
          items,
        }).unwrap();
      }
      setNewSpecRows([]);
      await refreshProductSpecs(editingProduct.id);
      dispatch(
        toast.success(
          items.length === 1
            ? "Specification added"
            : `${items.length} specifications added`,
        ),
      );
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to add specifications.")),
      );
    }
  }

  async function handleReplaceAllSpecs() {
    if (!editingProduct) return;
    const confirmed = window.confirm(
      "Replace all specifications with the draft rows below? Existing specs will be deleted.",
    );
    if (!confirmed) return;

    const items = newSpecRows
      .map((row, index) => ({
        name: row.name.trim(),
        value: row.value.trim(),
        sortOrder: index,
      }))
      .filter((row) => row.name && row.value);

    try {
      const result = await replaceSpecs({
        productId: editingProduct.id,
        items,
      }).unwrap();
      syncSpecState(result.data ?? []);
      setNewSpecRows([]);
      dispatch(toast.success("Specifications replaced"));
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to replace specifications.")),
      );
    }
  }

  async function handleClearAllSpecs() {
    if (!editingProduct) return;
    if ((editingProduct.specifications?.length ?? 0) === 0) return;
    const confirmed = window.confirm(
      "Clear all specifications for this product?",
    );
    if (!confirmed) return;

    try {
      const result = await replaceSpecs({
        productId: editingProduct.id,
        items: [],
      }).unwrap();
      syncSpecState(result.data ?? []);
      dispatch(toast.success("All specifications cleared"));
    } catch (err) {
      dispatch(
        toast.error(getErrorMessage(err, "Failed to clear specifications.")),
      );
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Create and manage catalog products."
        action={
          <AdminPrimaryButton onClick={openCreate}>
            Add product
          </AdminPrimaryButton>
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
              placeholder="Search name, slug, SKU, barcode…"
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
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as ProductStatus | "");
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={brandFilter}
            onChange={(e) => {
              setPage(1);
              setBrandFilter(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setPage(1);
              setCategoryFilter(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={featuredFilter}
            onChange={(e) => {
              setPage(1);
              setFeaturedFilter(e.target.value as "" | "true" | "false");
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950 outline-none focus:border-brand-600"
          >
            <option value="">Featured: all</option>
            <option value="true">Featured</option>
            <option value="false">Not featured</option>
          </select>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-950">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setPage(1);
                setLowStockOnly(e.target.checked);
              }}
              className="rounded border-slate-300"
            />
            Low stock only
          </label>
        </div>
      </div>

      <AdminPanel
        title={
          meta
            ? `${meta.total} product${meta.total === 1 ? "" : "s"}`
            : "Products"
        }
      >
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading products…
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

        {!isLoading && !listErrorMessage && products.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {hasActiveFilters
              ? "No products match your filters."
              : "No products yet. Add your first product to get started."}
          </p>
        ) : null}

        {!isLoading && !listErrorMessage && products.length > 0 ? (
          <>
            <AdminTable
              columns={[
                "Product",
                "SKU",
                "Brand",
                "Category",
                "Price",
                "Stock",
                "Featured",
                "Status",
                "Actions",
              ]}
              rows={products.map((product) => [
                <div key={product.id} className="flex items-center gap-3">
                  {product.thumbnail?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.thumbnail.url}
                      alt=""
                      className="h-9 w-9 rounded-lg border border-slate-100 object-cover"
                    />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-800">
                      {product.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="font-semibold text-brand-950">
                    {product.name}
                  </span>
                </div>,
                <span key={`${product.id}-sku`} className="font-mono text-xs">
                  {product.sku || "—"}
                </span>,
                product.brand?.name ?? "—",
                product.category?.name ?? "—",
                displayPrice(product),
                product.isLowStock ? (
                  <span
                    key={`${product.id}-stock`}
                    className="font-medium text-amber-700"
                  >
                    {product.stock}
                  </span>
                ) : (
                  String(product.stock)
                ),
                product.isFeatured ? "Yes" : "No",
                <StatusPill
                  key={`${product.id}-status`}
                  label={product.status ?? "—"}
                  tone={statusTone(product.status)}
                />,
                <div
                  key={`${product.id}-actions`}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(product)}
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
            onClick={() => closeDialog()}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-dialog-title"
            className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <h2
                id="product-dialog-title"
                className="font-display text-lg font-bold text-brand-950"
              >
                {dialogMode === "create" ? "Add product" : "Edit product"}
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
              {isLoadingProduct ? (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Loading product details…
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name *
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                    placeholder="Wireless Bluetooth Headphones"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    SKU *
                  </span>
                  <input
                    required
                    value={form.sku}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 font-mono text-sm outline-none focus:border-brand-600"
                    placeholder="SKU-WBH-001"
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
                    placeholder="wireless-bluetooth-headphones"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Brand *
                  </span>
                  <select
                    required
                    value={form.brandId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, brandId: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Category *
                  </span>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Price *
                  </span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                    placeholder="149.99"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sale price
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salePrice}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        salePrice: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                    placeholder="119.99"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cost price
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        costPrice: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Barcode
                  </span>
                  <input
                    value={form.barcode}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, barcode: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 font-mono text-sm outline-none focus:border-brand-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Stock
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, stock: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Low stock at
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.lowStock}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lowStock: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  />
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
                        status: e.target.value as ProductStatus,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </label>

                <label className="flex flex-col">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Featured
                  </span>
                  <label className="mt-auto flex items-center gap-2 rounded-xl border-2 border-brand-900/10 px-4 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isFeatured: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-300"
                    />
                    Feature on storefront
                  </label>
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
                  rows={3}
                  maxLength={5000}
                  className="w-full resize-y rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
                  placeholder="Noise-cancelling over-ear headphones."
                />
              </label>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Images
                  </span>
                  <span className="text-xs text-slate-400">
                    Max {MAX_UPLOAD_FILES} files · JPEG/PNG/WebP/GIF/SVG · 5 MB
                  </span>
                </div>

                {dialogMode === "edit" &&
                (editingProduct?.images?.length ?? 0) > 0 ? (
                  <SortableList
                    className="mb-3 space-y-3"
                    disabled={isSaving}
                    items={[...(editingProduct!.images ?? [])].sort(
                      (a, b) => a.sortOrder - b.sortOrder,
                    )}
                    onReorder={handleReorderImages}
                    renderItem={(image) => {
                      const altDraft = imageAltDrafts[image.id] ?? "";
                      const altDirty = altDraft !== (image.alt ?? "");
                      return (
                        <div className="flex gap-3 rounded-xl border border-slate-100 p-2.5">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.url}
                              alt={image.alt ?? ""}
                              className="h-full w-full object-cover"
                            />
                            {image.isThumbnail ? (
                              <span className="absolute left-1 top-1 rounded bg-brand-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                Thumb
                              </span>
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {!image.isThumbnail ? (
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() =>
                                    handleSetThumbnail(image.id)
                                  }
                                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-50"
                                >
                                  Set thumb
                                </button>
                              ) : null}
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleDeleteImage(image.id)}
                                className="rounded-lg border border-red-100 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                Delete
                              </button>
                              <span className="ml-auto text-[11px] text-slate-400">
                                Drag to reorder · #{image.sortOrder}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <input
                                value={altDraft}
                                maxLength={255}
                                onChange={(e) =>
                                  setImageAltDrafts((prev) => ({
                                    ...prev,
                                    [image.id]: e.target.value,
                                  }))
                                }
                                placeholder="Alt text"
                                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600"
                              />
                              <button
                                type="button"
                                disabled={
                                  isSaving ||
                                  !altDirty ||
                                  savingAltImageId === image.id
                                }
                                onClick={() => handleSaveImageAlt(image.id)}
                                className="shrink-0 rounded-lg bg-brand-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
                              >
                                {savingAltImageId === image.id
                                  ? "Saving…"
                                  : "Save alt"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                ) : null}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []).slice(
                      0,
                      MAX_UPLOAD_FILES,
                    );
                    setSelectedImages(files);
                    e.target.value = "";
                  }}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-900 hover:file:bg-brand-100"
                />

                {imagePreviews.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {imagePreviews.map((src, index) => (
                      <div
                        key={`${src}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-dashed border-brand-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-brand-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          New
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Shop filters
                  </span>
                  <span className="text-xs text-slate-400">
                    Driven by the selected category
                  </span>
                </div>
                <ProductFilterFields
                  categoryId={form.categoryId}
                  values={form.attributeValues}
                  categoryChangedWarning={categoryChangedWarning}
                  onChange={(attributeValues) =>
                    setForm((prev) => ({ ...prev, attributeValues }))
                  }
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Specifications
                  </span>
                  {dialogMode === "edit" ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          editingProduct &&
                          refreshProductSpecs(editingProduct.id).catch((err) =>
                            dispatch(
                              toast.error(
                                getErrorMessage(
                                  err,
                                  "Failed to refresh specifications.",
                                ),
                              ),
                            ),
                          )
                        }
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-50"
                      >
                        Refresh
                      </button>
                      <button
                        type="button"
                        disabled={
                          isSaving ||
                          (editingProduct?.specifications?.length ?? 0) === 0
                        }
                        onClick={handleClearAllSpecs}
                        className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        Clear all
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          specs: [...prev.specs, { name: "", value: "" }],
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                    >
                      Add spec
                    </button>
                  )}
                </div>

                {dialogMode === "edit" ? (
                  <div className="space-y-3">
                    {(editingProduct?.specifications?.length ?? 0) === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                        No specifications yet. Add rows below.
                      </p>
                    ) : (
                      <SortableList
                        className="space-y-2"
                        disabled={isSaving}
                        items={[...(editingProduct!.specifications ?? [])].sort(
                          (a, b) => a.sortOrder - b.sortOrder,
                        )}
                        onReorder={handleReorderSpecs}
                        renderItem={(spec) => {
                          const draft = specDrafts[spec.id] ?? {
                            name: spec.name,
                            value: spec.value,
                          };
                          const dirty =
                            draft.name !== spec.name ||
                            draft.value !== spec.value;
                          return (
                            <div className="rounded-xl border border-slate-100 p-2.5">
                              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleDeleteSpec(spec.id)}
                                  className="rounded-lg border border-red-100 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Delete
                                </button>
                                <span className="ml-auto text-[11px] text-slate-400">
                                  Drag to reorder · #{spec.sortOrder}
                                </span>
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <input
                                  value={draft.name}
                                  maxLength={120}
                                  onChange={(e) =>
                                    setSpecDrafts((prev) => ({
                                      ...prev,
                                      [spec.id]: {
                                        ...draft,
                                        name: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Name"
                                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-600 sm:w-1/3"
                                />
                                <input
                                  value={draft.value}
                                  maxLength={500}
                                  onChange={(e) =>
                                    setSpecDrafts((prev) => ({
                                      ...prev,
                                      [spec.id]: {
                                        ...draft,
                                        value: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Value"
                                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-600"
                                />
                                <button
                                  type="button"
                                  disabled={
                                    isSaving ||
                                    !dirty ||
                                    savingSpecId === spec.id
                                  }
                                  onClick={() => handleSaveSpec(spec.id)}
                                  className="shrink-0 rounded-lg bg-brand-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
                                >
                                  {savingSpecId === spec.id
                                    ? "Saving…"
                                    : "Save"}
                                </button>
                              </div>
                            </div>
                          );
                        }}
                      />
                    )}

                    <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Add new specs
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewSpecRows((prev) => [
                              ...prev,
                              { name: "", value: "" },
                            ])
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-950 hover:bg-brand-50"
                        >
                          Add row
                        </button>
                      </div>

                      {newSpecRows.length === 0 ? (
                        <p className="text-center text-xs text-slate-400">
                          Click “Add row”, then save with Create / Bulk or
                          Replace all.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {newSpecRows.map((row, index) => (
                            <div
                              key={`new-spec-${index}`}
                              className="flex items-start gap-2"
                            >
                              <input
                                value={row.name}
                                maxLength={120}
                                onChange={(e) =>
                                  setNewSpecRows((prev) =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? { ...item, name: e.target.value }
                                        : item,
                                    ),
                                  )
                                }
                                placeholder="Name"
                                className="w-1/3 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-600"
                              />
                              <input
                                value={row.value}
                                maxLength={500}
                                onChange={(e) =>
                                  setNewSpecRows((prev) =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? { ...item, value: e.target.value }
                                        : item,
                                    ),
                                  )
                                }
                                placeholder="Value"
                                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-600"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setNewSpecRows((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  )
                                }
                                className="rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          ))}

                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={handleBulkAddSpecs}
                              className="rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                            >
                              {newSpecRows.length > 1
                                ? "Bulk create"
                                : "Create spec"}
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={handleReplaceAllSpecs}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-950 hover:bg-brand-50 disabled:opacity-50"
                            >
                              Replace all with these
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : form.specs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                    Optional key/value specs (e.g. RAM → 16GB).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.specs.map((spec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <input
                          value={spec.name}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              specs: prev.specs.map((row, i) =>
                                i === index
                                  ? { ...row, name: e.target.value }
                                  : row,
                              ),
                            }))
                          }
                          placeholder="Name"
                          className="w-1/3 rounded-xl border-2 border-brand-900/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                        />
                        <input
                          value={spec.value}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              specs: prev.specs.map((row, i) =>
                                i === index
                                  ? { ...row, value: e.target.value }
                                  : row,
                              ),
                            }))
                          }
                          placeholder="Value"
                          className="min-w-0 flex-1 rounded-xl border-2 border-brand-900/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              specs: prev.specs.filter((_, i) => i !== index),
                            }))
                          }
                          className="rounded-lg border border-red-100 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  disabled={isSaving || isLoadingProduct}
                  className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving…"
                    : dialogMode === "create"
                      ? "Create product"
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
            aria-labelledby="delete-product-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-product-title"
              className="font-display text-lg font-bold text-brand-950"
            >
              Delete product
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete{" "}
              <span className="font-semibold text-brand-950">
                {deleteTarget.name}
              </span>{" "}
              ({deleteTarget.sku})? This soft-deletes the product.
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
