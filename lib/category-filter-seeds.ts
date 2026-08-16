import type { AttributeInputType } from "@/lib/catalog-query";

export type CategoryAttributeSeed = {
  name: string;
  inputType: AttributeInputType;
  isFilterable: boolean;
  isRequired: boolean;
  options?: Array<{ label: string }>;
};

const AIR_CONDITIONER_SEED: CategoryAttributeSeed[] = [
  {
    name: "Capacity",
    inputType: "SELECT",
    isFilterable: true,
    isRequired: true,
    options: [
      { label: "1 Ton" },
      { label: "1.5 Ton" },
      { label: "2 Ton" },
      { label: "2.5 Ton" },
    ],
  },
  {
    name: "Type",
    inputType: "SELECT",
    isFilterable: true,
    isRequired: true,
    options: [
      { label: "Split" },
      { label: "Window" },
      { label: "Floor Standing" },
      { label: "Cassette" },
    ],
  },
  {
    name: "Inverter",
    inputType: "BOOLEAN",
    isFilterable: true,
    isRequired: false,
    options: [{ label: "Yes" }, { label: "No" }],
  },
];

const REFRIGERATOR_SEED: CategoryAttributeSeed[] = [
  {
    name: "Size",
    inputType: "SELECT",
    isFilterable: true,
    isRequired: true,
    options: [
      { label: "10 cu ft" },
      { label: "12 cu ft" },
      { label: "14 cu ft" },
      { label: "16 cu ft" },
      { label: "18 cu ft" },
      { label: "20+ cu ft" },
    ],
  },
  {
    name: "Door type",
    inputType: "SELECT",
    isFilterable: true,
    isRequired: true,
    options: [
      { label: "Single Door" },
      { label: "Double Door" },
      { label: "Triple Door" },
      { label: "Side by Side" },
      { label: "French Door" },
    ],
  },
  {
    name: "Inverter",
    inputType: "BOOLEAN",
    isFilterable: true,
    isRequired: false,
    options: [{ label: "Yes" }, { label: "No" }],
  },
];

const SEEDS_BY_SLUG: Record<string, CategoryAttributeSeed[]> = {
  "air-conditioner": AIR_CONDITIONER_SEED,
  "air-conditioners": AIR_CONDITIONER_SEED,
  refrigerator: REFRIGERATOR_SEED,
  refrigerators: REFRIGERATOR_SEED,
};

export const MAX_ATTRIBUTES_PER_CATEGORY = 20;
export const MAX_OPTIONS_PER_ATTRIBUTE = 50;

export function getCategoryFilterSeed(
  slug: string | null | undefined,
): CategoryAttributeSeed[] | null {
  if (!slug) return null;
  return SEEDS_BY_SLUG[slug.trim().toLowerCase()] ?? null;
}
