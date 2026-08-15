import { permissionShortLabel } from "@/lib/rbac";

export function PermissionChips({
  permissions,
  empty = "None",
}: {
  permissions: string[];
  empty?: string;
}) {
  if (!permissions.length) {
    return <span className="text-xs text-slate-400">{empty}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {permissions.map((permission) => (
        <span
          key={permission}
          className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800"
        >
          {permissionShortLabel(permission)}
        </span>
      ))}
    </div>
  );
}
