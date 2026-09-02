"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/data";
import type { CategoryFilterGroup } from "@/app/admin/(panel)/categories/store/categoryAPI";
import type { CatalogQueryState } from "@/lib/catalog-query";
import {
  filterGroupName,
  filterGroupSlug,
  filterOptionLabel,
  filterOptionValue,
  isOptionUnavailable,
} from "@/lib/category-filters";

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function PriceRange({
  min,
  max,
  valueMin,
  valueMax,
  onCommit,
}: {
  min: number;
  max: number;
  valueMin?: number;
  valueMax?: number;
  onCommit: (next: { minPrice?: number; maxPrice?: number }) => void;
}) {
  const boundMin = Math.min(min, valueMin ?? min);
  const boundMax = Math.max(max, valueMax ?? max);
  const [lo, setLo] = useState(valueMin ?? boundMin);
  const [hi, setHi] = useState(valueMax ?? boundMax);
  const loRef = useRef(lo);
  const hiRef = useRef(hi);

  useEffect(() => {
    const nextLo = valueMin ?? boundMin;
    const nextHi = valueMax ?? boundMax;
    setLo(nextLo);
    setHi(nextHi);
    loRef.current = nextLo;
    hiRef.current = nextHi;
  }, [boundMin, boundMax, valueMin, valueMax]);

  function commitCurrent() {
    const nextLo = loRef.current;
    const nextHi = hiRef.current;
    const minPrice = nextLo <= boundMin ? undefined : nextLo;
    const maxPrice = nextHi >= boundMax ? undefined : nextHi;
    if (minPrice === valueMin && maxPrice === valueMax) return;
    onCommit({ minPrice, maxPrice });
  }

  return (
    <div className="space-y-3">
      <div className="relative h-6">
        <input
          type="range"
          min={boundMin}
          max={boundMax}
          value={lo}
          onChange={(e) => {
            const nextLo = Math.min(Number(e.target.value), hiRef.current);
            loRef.current = nextLo;
            setLo(nextLo);
          }}
          onPointerUp={commitCurrent}
          onKeyUp={commitCurrent}
          onBlur={commitCurrent}
          className="absolute inset-x-0 top-1.5 z-10 h-1.5 w-full appearance-none bg-transparent"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={boundMin}
          max={boundMax}
          value={hi}
          onChange={(e) => {
            const nextHi = Math.max(Number(e.target.value), loRef.current);
            hiRef.current = nextHi;
            setHi(nextHi);
          }}
          onPointerUp={commitCurrent}
          onKeyUp={commitCurrent}
          onBlur={commitCurrent}
          className="absolute inset-x-0 top-1.5 z-20 h-1.5 w-full appearance-none bg-transparent"
          aria-label="Maximum price"
        />
        <div className="absolute inset-x-0 top-2.75 h-1.5 rounded-full bg-slate-200" />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
        <span>{formatPrice(lo)}</span>
        <span>{formatPrice(hi)}</span>
      </div>
    </div>
  );
}

function FilterOptions({
  group,
  selected,
  onChange,
}: {
  group: CategoryFilterGroup;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const name = filterGroupSlug(group) || group.source;

  return (
    <ul className="space-y-1.5">
      {group.options.map((option, index) => {
        const value = filterOptionValue(option);
        if (!value) return null;
        const checked = selected.includes(value);
        const unavailable = isOptionUnavailable(option, checked);
        const id = `${name}-${value}-${index}`;

        if (unavailable) return null;

        return (
          <li key={id}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-slate-700 hover:bg-slate-50">
              <input
                id={id}
                type="checkbox"
                value={value}
                checked={checked}
                onChange={() => onChange(toggleValue(selected, value))}
                className="rounded border-slate-300 text-brand-700 focus:ring-brand-600"
              />
              <span className="min-w-0 flex-1">{filterOptionLabel(option)}</span>
              <span className="text-xs text-slate-400">{option.count}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export function CollectionFilters({
  filters,
  price,
  state,
  onChange,
}: {
  filters: CategoryFilterGroup[];
  price?: { min: number | null; max: number | null };
  state: CatalogQueryState;
  onChange: (next: CatalogQueryState) => void;
}) {
  const boundsRef = useRef<{ min: number; max: number } | null>(null);
  const incomingMin = price?.min;
  const incomingMax = price?.max;
  if (
    incomingMin != null &&
    incomingMax != null &&
    Number.isFinite(incomingMin) &&
    Number.isFinite(incomingMax)
  ) {
    const current = boundsRef.current;
    boundsRef.current = {
      min: current ? Math.min(current.min, incomingMin) : incomingMin,
      max: current ? Math.max(current.max, incomingMax) : incomingMax,
    };
  }

  const priceMin = boundsRef.current?.min;
  const priceMax = boundsRef.current?.max;
  const showPrice =
    priceMin != null &&
    priceMax != null &&
    Number.isFinite(priceMin) &&
    Number.isFinite(priceMax) &&
    priceMax > priceMin;

  function patch(partial: Partial<CatalogQueryState>) {
    onChange({ ...state, page: 1, ...partial });
  }

  return (
    <div className="space-y-6">
      {showPrice ? (
        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            Price
          </h3>
          <PriceRange
            min={priceMin}
            max={priceMax}
            valueMin={state.minPrice}
            valueMax={state.maxPrice}
            onCommit={({ minPrice, maxPrice }) =>
              patch({ minPrice, maxPrice })
            }
          />
        </section>
      ) : null}

      {filters.map((group, index) => {
        const source = group.source?.toLowerCase();
        const title = filterGroupName(group);
        const slug = filterGroupSlug(group);

        if (source === "availability") {
          const inStockOption = group.options.find((option) => {
            const value = filterOptionValue(option).toLowerCase();
            const label = filterOptionLabel(option).toLowerCase();
            return (
              value === "true" ||
              value === "in-stock" ||
              value === "instock" ||
              label.includes("in stock")
            );
          });
          const option = inStockOption ?? group.options[0];
          if (!option) return null;
          const unavailable = option.count === 0 && !state.inStock;

          return (
            <section key={`${source}-${index}`}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                {title}
              </h3>
              <label
                className={`flex items-center gap-2.5 rounded-lg px-1 py-1 text-sm ${
                  unavailable
                    ? "cursor-not-allowed text-slate-300"
                    : "cursor-pointer text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={state.inStock}
                  disabled={unavailable}
                  onChange={() => {
                    if (unavailable) return;
                    patch({ inStock: !state.inStock });
                  }}
                  className="rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                />
                <span className="min-w-0 flex-1">
                  {filterOptionLabel(option) || "In stock"}
                </span>
                <span className="text-xs text-slate-400">{option.count}</span>
              </label>
            </section>
          );
        }

        if (source === "brand") {
          return (
            <section key={`${source}-${index}`}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                {title}
              </h3>
              <FilterOptions
                group={{ ...group, inputType: "MULTI_SELECT" }}
                selected={state.brandIds}
                onChange={(brandIds) => patch({ brandIds })}
              />
            </section>
          );
        }

        if (source === "attribute" && slug) {
          return (
            <section key={`${slug}-${index}`}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                {title}
              </h3>
              <FilterOptions
                group={group}
                selected={state.attrs[slug] ?? []}
                onChange={(values) =>
                  patch({
                    attrs: {
                      ...state.attrs,
                      [slug]: values,
                    },
                  })
                }
              />
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
