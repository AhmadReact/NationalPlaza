import type {
  CategoryFilterGroup,
  CategoryFilterOption,
} from "@/app/admin/(panel)/categories/store/categoryAPI";
import type { AttributeInputType } from "@/lib/catalog-query";

export function filterGroupName(group: CategoryFilterGroup): string {
  return group.name?.trim() || group.label?.trim() || group.slug || group.source;
}

export function filterGroupSlug(group: CategoryFilterGroup): string | undefined {
  return group.slug?.trim() || undefined;
}

export function filterOptionValue(option: CategoryFilterOption): string {
  return option.value || option.slug || option.id || "";
}

export function filterOptionLabel(option: CategoryFilterOption): string {
  return option.label?.trim() || filterOptionValue(option);
}

export function normalizeInputType(
  value: string | undefined,
): AttributeInputType | undefined {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized === "SELECT" ||
    normalized === "MULTI_SELECT" ||
    normalized === "BOOLEAN"
  ) {
    return normalized;
  }
  return undefined;
}

export function isOptionUnavailable(
  option: CategoryFilterOption,
  selected: boolean,
): boolean {
  return option.count === 0 && !selected;
}
