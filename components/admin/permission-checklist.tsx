import {
  permissionLabel,
  type Permission,
} from "@/lib/rbac";

export function PermissionChecklist({
  catalog,
  selected,
  onChange,
  locked = false,
  disabledPermissions = [],
  checkedPermissions = [],
}: {
  catalog: Permission[];
  selected: Permission[];
  onChange: (next: Permission[]) => void;
  locked?: boolean;
  disabledPermissions?: Permission[];
  /** Extra ids that should appear checked (e.g. role grants on a user form). */
  checkedPermissions?: Permission[];
}) {
  const disabled = new Set(disabledPermissions);
  const forcedChecked = new Set(checkedPermissions);

  function toggle(permission: Permission) {
    if (locked || disabled.has(permission) || forcedChecked.has(permission)) {
      return;
    }
    if (selected.includes(permission)) {
      onChange(selected.filter((item) => item !== permission));
      return;
    }
    onChange([...selected, permission]);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {catalog.map((permission) => {
        const isChecked =
          locked ||
          forcedChecked.has(permission) ||
          selected.includes(permission);
        const isDisabled =
          locked || disabled.has(permission) || forcedChecked.has(permission);
        return (
          <label
            key={permission}
            className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${
              isDisabled
                ? "border-slate-100 bg-slate-50 text-slate-500"
                : "border-slate-200 bg-white text-brand-950"
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isDisabled}
              onChange={() => toggle(permission)}
              className="mt-0.5 rounded border-slate-300"
            />
            <span>
              <span className="block font-semibold">
                {permissionLabel(permission)}
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {permission}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
