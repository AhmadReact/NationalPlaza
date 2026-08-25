export type HomeSectionType = "CATEGORY_PRODUCTS" | "FEATURED_PRODUCTS";

export type HomeLinkTarget = {
  id: string;
  name: string;
  slug: string;
};

export type HomeCategoryCard = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  href: string;
};

export type HomeProductCard = {
  id: string;
  name: string;
  slug: string;
  brand: HomeLinkTarget;
  category: HomeLinkTarget;
  price: number;
  salePrice: number | null;
  onSale: boolean;
  thumbnailUrl: string | null;
  thumbnailAlt: string | null;
  averageRating: number;
  reviewCount: number;
  stock: number;
  href: string;
};

export type HomeStorefrontSection = {
  id: string;
  title: string;
  type: HomeSectionType;
  href: string | null;
  products: HomeProductCard[];
};

export type HomePage = {
  categories: HomeCategoryCard[];
  sections: HomeStorefrontSection[];
};

export type HomeSection = {
  id: string;
  title: string | null;
  type: HomeSectionType;
  categoryId: string | null;
  category: (HomeLinkTarget & { isActive: boolean }) | null;
  productLimit: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const HOME_SECTION_TYPE_LABEL: Record<HomeSectionType, string> = {
  CATEGORY_PRODUCTS: "Category products",
  FEATURED_PRODUCTS: "Featured products",
};

export function homeSectionStorefrontWarning(section: HomeSection): string | null {
  if (!section.isActive) {
    return "Inactive sections do not appear on the storefront.";
  }
  if (section.type !== "CATEGORY_PRODUCTS") return null;
  if (!section.category) {
    return "This category is missing, so the row will not appear on the storefront.";
  }
  if (!section.category.isActive) {
    return "This category is inactive, so the row will not appear on the storefront.";
  }
  return null;
}
