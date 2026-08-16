"use client";

import {
  useGetCategoryAttributesQuery,
  type CategoryAttribute,
} from "@/app/admin/(panel)/categories/store/categoryAPI";

export function selectionsFromAttributeValues(
  values:
    | Array<{
        attributeId: string;
        optionIds?: string[];
        optionId?: string;
        options?: Array<{ id: string }>;
      }>
    | undefined,
): Record<string, string[]> {
  const next: Record<string, string[]> = {};
  for (const value of values ?? []) {
    const ids =
      value.optionIds ??
      (value.optionId ? [value.optionId] : undefined) ??
      value.options?.map((option) => option.id) ??
      [];
    next[value.attributeId] = ids.filter(Boolean);
  }
  return next;
}

export function toAttributeWritePayload(
  selections: Record<string, string[]>,
): Array<{ attributeId: string; optionIds: string[] }> {
  return Object.entries(selections)
    .filter(([, optionIds]) => optionIds.length > 0)
    .map(([attributeId, optionIds]) => ({ attributeId, optionIds }));
}

export function ProductFilterFields({
  categoryId,
  values,
  onChange,
  categoryChangedWarning,
}: {
  categoryId: string;
  values: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  categoryChangedWarning?: boolean;
}) {
  const { data, isLoading, isError, error } = useGetCategoryAttributesQuery(
    categoryId,
    { skip: !categoryId },
  );
  const attributes = (data?.data ?? []).filter(
    (attribute) => attribute.isFilterable !== false,
  );

  if (!categoryId) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
        Select a category to load its shop filters.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="rounded-xl border border-slate-100 px-3 py-4 text-center text-xs text-slate-400">
        Loading category filters…
      </p>
    );
  }

  if (isError) {
    const message =
      error && typeof error === "object" && "data" in error
        ? String(
            (error as { data?: { message?: string } }).data?.message ??
              "Could not load category filters.",
          )
        : "Could not load category filters.";
    return (
      <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 text-xs text-amber-800">
        {message} Shop filters will be available once the category attributes
        API is deployed.
      </p>
    );
  }

  if (attributes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
        This category has no filter attributes yet. Add them under Categories →
        Filters. Specifications below stay as free-text product details.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {categoryChangedWarning ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Category changed — previous filter values were cleared.
        </p>
      ) : null}
      {attributes.map((attribute) => (
        <AttributeField
          key={attribute.id}
          attribute={attribute}
          selected={values[attribute.id] ?? []}
          onChange={(optionIds) =>
            onChange({ ...values, [attribute.id]: optionIds })
          }
        />
      ))}
    </div>
  );
}

function AttributeField({
  attribute,
  selected,
  onChange,
}: {
  attribute: CategoryAttribute;
  selected: string[];
  onChange: (optionIds: string[]) => void;
}) {
  const options = [...(attribute.options ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const requiredMark = attribute.isRequired ? " *" : "";

  if (attribute.inputType === "MULTI_SELECT") {
    return (
      <fieldset className="block">
        <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          {attribute.name}
          {requiredMark}
        </legend>
        <div className="space-y-1.5 rounded-xl border-2 border-brand-900/10 px-3 py-2.5">
          {options.length === 0 ? (
            <p className="text-xs text-slate-400">No options configured.</p>
          ) : (
            options.map((option) => {
              const checked = selected.includes(option.id);
              return (
                <label
                  key={option.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange(
                        checked
                          ? selected.filter((id) => id !== option.id)
                          : [...selected, option.id],
                      )
                    }
                    className="rounded border-slate-300"
                  />
                  {option.label}
                </label>
              );
            })
          )}
        </div>
      </fieldset>
    );
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {attribute.name}
        {requiredMark}
      </span>
      <select
        required={attribute.isRequired}
        value={selected[0] ?? ""}
        onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
        className="w-full rounded-xl border-2 border-brand-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600"
      >
        <option value="">{attribute.isRequired ? "Select…" : "None"}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
