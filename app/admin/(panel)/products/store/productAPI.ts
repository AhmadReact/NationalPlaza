import { createApi } from "@reduxjs/toolkit/query/react";
import { toCatalogQueryString, type CatalogApiParams } from "@/lib/catalog-query";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";

export type ProductStatus = "ACTIVE" | "INACTIVE";

export type ProductRef = {
  id: string;
  name: string;
  slug: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isThumbnail: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductSpecification = {
  id: string;
  productId: string;
  name: string;
  value: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductAttributeOptionRef = {
  id: string;
  label?: string;
  slug?: string;
  value?: string;
};

export type ProductAttributeValue = {
  attributeId: string;
  optionIds?: string[];
  optionId?: string;
  attribute?: {
    id: string;
    name: string;
    slug?: string;
    inputType?: string;
  };
  options?: ProductAttributeOptionRef[];
};

export type ProductAttributeWrite = {
  attributeId: string;
  optionIds: string[];
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  price: number;
  salePrice: number | null;
  costPrice: number | null;
  stock: number;
  lowStock: number;
  isLowStock: boolean;
  isFeatured: boolean;
  status: ProductStatus;
  brandId: string;
  categoryId: string;
  brand: ProductRef;
  category: ProductRef;
  images: ProductImage[];
  thumbnail: ProductImage | null;
  specifications: ProductSpecification[];
  attributeValues?: ProductAttributeValue[];
  createdAt: string;
  updatedAt: string;
};

export type ProductListParams = CatalogApiParams & {
  isFeatured?: boolean;
  lowStockOnly?: boolean;
};

export type CreateProductInput = {
  name: string;
  sku: string;
  brandId: string;
  categoryId: string;
  price: number;
  slug?: string;
  barcode?: string;
  description?: string;
  salePrice?: number;
  costPrice?: number;
  stock?: number;
  lowStock?: number;
  isFeatured?: boolean;
  status?: ProductStatus;
  attributeValues?: ProductAttributeWrite[];
};

export type UpdateProductInput = {
  id: string;
  name?: string;
  sku?: string;
  brandId?: string;
  categoryId?: string;
  price?: number;
  slug?: string;
  barcode?: string | null;
  description?: string | null;
  salePrice?: number | null;
  costPrice?: number | null;
  stock?: number;
  lowStock?: number;
  isFeatured?: boolean;
  status?: ProductStatus;
  attributeValues?: ProductAttributeWrite[];
};

export type ReplaceProductAttributesInput = {
  productId: string;
  items: ProductAttributeWrite[];
};

export type UploadProductImagesInput = {
  productId: string;
  images: File[];
};

export type ReorderProductImagesInput = {
  productId: string;
  items: Array<{ id: string; sortOrder: number }>;
};

export type UpdateProductImageInput = {
  productId: string;
  imageId: string;
  alt?: string;
  sortOrder?: number;
};

export type SetProductThumbnailInput = {
  productId: string;
  imageId: string;
};

export type DeleteProductImageInput = {
  productId: string;
  imageId: string;
};

export type CreateProductSpecInput = {
  productId: string;
  name: string;
  value: string;
  sortOrder?: number;
};

export type BulkCreateProductSpecsInput = {
  productId: string;
  items: Array<{ name: string; value: string; sortOrder?: number }>;
};

export type ReplaceProductSpecsInput = {
  productId: string;
  items: Array<{ name: string; value: string; sortOrder?: number }>;
};

export type ReorderProductSpecsInput = {
  productId: string;
  items: Array<{ id: string; sortOrder: number }>;
};

export type UpdateProductSpecInput = {
  productId: string;
  specificationId: string;
  name?: string;
  value?: string;
  sortOrder?: number;
};

export type DeleteProductSpecInput = {
  productId: string;
  specificationId: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  errors: unknown;
  meta: PaginationMeta;
};

export type ApiMutationResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  meta: unknown;
};

function toQueryString(
  params: ProductListParams & { isFeatured?: boolean; lowStockOnly?: boolean },
): string {
  const searchParams = new URLSearchParams(
    toCatalogQueryString({
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: params.status,
      brandId: params.brandId,
      categoryId: params.categoryId,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      inStock: params.inStock,
      attrs: params.attrs,
      isFeatured: params.isFeatured,
    }).replace(/^\?/, ""),
  );

  if (params.lowStockOnly !== undefined) {
    searchParams.set("lowStockOnly", String(params.lowStockOnly));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toImagesFormData(files: File[]): FormData {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("images", file);
  });
  return formData;
}

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Product", "ProductImage", "ProductSpecification", "ProductAttribute"],
  endpoints: (builder) => ({
    // ── Products CRUD ──────────────────────────────────────────────
    getProducts: builder.query<
      ApiListResponse<Product>,
      ProductListParams | void
    >({
      query: (params) => ({
        url: `/products${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          search: params?.search,
          status: params?.status,
          brandId: params?.brandId,
          categoryId: params?.categoryId,
          minPrice: params?.minPrice,
          maxPrice: params?.maxPrice,
          inStock: params?.inStock,
          attrs: params?.attrs,
          isFeatured: params?.isFeatured,
          lowStockOnly: params?.lowStockOnly,
        })}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({
                type: "Product" as const,
                id,
              })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),
    getProductById: builder.query<ApiMutationResponse<Product>, string>({
      query: (id) => ({
        url: `/products/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),
    getProductBySlug: builder.query<ApiMutationResponse<Product>, string>({
      query: (slug) => ({
        url: `/products/slug/${encodeURIComponent(slug)}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data?.id
          ? [{ type: "Product", id: result.data.id }]
          : [{ type: "Product", id: "LIST" }],
    }),
    createProduct: builder.mutation<
      ApiMutationResponse<Product>,
      CreateProductInput
    >({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProduct: builder.mutation<
      ApiMutationResponse<Product>,
      UpdateProductInput
    >({
      query: ({ id, ...body }) => ({
        url: `/products/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
    deleteProduct: builder.mutation<ApiMutationResponse<null>, string>({
      query: (id) => ({
        url: `/products/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
    restoreProduct: builder.mutation<ApiMutationResponse<Product>, string>({
      query: (id) => ({
        url: `/products/${encodeURIComponent(id)}/restore`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
    replaceProductAttributes: builder.mutation<
      ApiMutationResponse<ProductAttributeValue[]>,
      ReplaceProductAttributesInput
    >({
      query: ({ productId, items }) => ({
        url: `/products/${encodeURIComponent(productId)}/attributes`,
        method: "PUT",
        body: { items },
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Product", id: productId },
        { type: "ProductAttribute", id: productId },
        { type: "Product", id: "LIST" },
      ],
    }),

    // ── Product Images ─────────────────────────────────────────────
    getProductImages: builder.query<
      ApiMutationResponse<ProductImage[]>,
      string
    >({
      query: (productId) => ({
        url: `/products/${encodeURIComponent(productId)}/images`,
        method: "GET",
      }),
      providesTags: (_result, _error, productId) => [
        { type: "ProductImage", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    uploadProductImages: builder.mutation<
      ApiMutationResponse<ProductImage[]>,
      UploadProductImagesInput
    >({
      query: ({ productId, images }) => ({
        url: `/products/${encodeURIComponent(productId)}/images`,
        method: "POST",
        body: toImagesFormData(images),
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductImage", id: productId },
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
      ],
    }),
    reorderProductImages: builder.mutation<
      ApiMutationResponse<ProductImage[]>,
      ReorderProductImagesInput
    >({
      query: ({ productId, items }) => ({
        url: `/products/${encodeURIComponent(productId)}/images/reorder`,
        method: "PATCH",
        body: { items },
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductImage", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    setProductThumbnail: builder.mutation<
      ApiMutationResponse<ProductImage>,
      SetProductThumbnailInput
    >({
      query: ({ productId, imageId }) => ({
        url: `/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}/thumbnail`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductImage", id: productId },
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
      ],
    }),
    updateProductImage: builder.mutation<
      ApiMutationResponse<ProductImage>,
      UpdateProductImageInput
    >({
      query: ({ productId, imageId, ...body }) => ({
        url: `/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductImage", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    deleteProductImage: builder.mutation<
      ApiMutationResponse<null>,
      DeleteProductImageInput
    >({
      query: ({ productId, imageId }) => ({
        url: `/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductImage", id: productId },
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
      ],
    }),

    // ── Product Specifications ─────────────────────────────────────
    getProductSpecifications: builder.query<
      ApiMutationResponse<ProductSpecification[]>,
      string
    >({
      query: (productId) => ({
        url: `/products/${encodeURIComponent(productId)}/specifications`,
        method: "GET",
      }),
      providesTags: (_result, _error, productId) => [
        { type: "ProductSpecification", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    createProductSpecification: builder.mutation<
      ApiMutationResponse<ProductSpecification>,
      CreateProductSpecInput
    >({
      query: ({ productId, ...body }) => ({
        url: `/products/${encodeURIComponent(productId)}/specifications`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductSpecification", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    bulkCreateProductSpecifications: builder.mutation<
      ApiMutationResponse<ProductSpecification[]>,
      BulkCreateProductSpecsInput
    >({
      query: ({ productId, items }) => ({
        url: `/products/${encodeURIComponent(productId)}/specifications/bulk`,
        method: "POST",
        body: { items },
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductSpecification", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    replaceProductSpecifications: builder.mutation<
      ApiMutationResponse<ProductSpecification[]>,
      ReplaceProductSpecsInput
    >({
      query: ({ productId, items }) => ({
        url: `/products/${encodeURIComponent(productId)}/specifications`,
        method: "PUT",
        body: { items },
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductSpecification", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    reorderProductSpecifications: builder.mutation<
      ApiMutationResponse<ProductSpecification[]>,
      ReorderProductSpecsInput
    >({
      query: ({ productId, items }) => ({
        url: `/products/${encodeURIComponent(productId)}/specifications/reorder`,
        method: "PATCH",
        body: { items },
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductSpecification", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    updateProductSpecification: builder.mutation<
      ApiMutationResponse<ProductSpecification>,
      UpdateProductSpecInput
    >({
      query: ({ productId, specificationId, ...body }) => ({
        url: `/products/${encodeURIComponent(productId)}/specifications/${encodeURIComponent(specificationId)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductSpecification", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    deleteProductSpecification: builder.mutation<
      ApiMutationResponse<null>,
      DeleteProductSpecInput
    >({
      query: ({ productId, specificationId }) => ({
        url: `/products/${encodeURIComponent(productId)}/specifications/${encodeURIComponent(specificationId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "ProductSpecification", id: productId },
        { type: "Product", id: productId },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductByIdQuery,
  useLazyGetProductByIdQuery,
  useGetProductBySlugQuery,
  useLazyGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRestoreProductMutation,
  useReplaceProductAttributesMutation,
  useGetProductImagesQuery,
  useLazyGetProductImagesQuery,
  useUploadProductImagesMutation,
  useReorderProductImagesMutation,
  useSetProductThumbnailMutation,
  useUpdateProductImageMutation,
  useDeleteProductImageMutation,
  useGetProductSpecificationsQuery,
  useLazyGetProductSpecificationsQuery,
  useCreateProductSpecificationMutation,
  useBulkCreateProductSpecificationsMutation,
  useReplaceProductSpecificationsMutation,
  useReorderProductSpecificationsMutation,
  useUpdateProductSpecificationMutation,
  useDeleteProductSpecificationMutation,
} = productApi;
