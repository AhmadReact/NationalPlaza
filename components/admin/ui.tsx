import { AdminIcon } from "@/components/admin/icons";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function AdminPrimaryButton({
  children,
  icon = "plus",
  type = "button",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  icon?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <AdminIcon name={icon} className="h-4 w-4" />
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "brand" | "gold" | "emerald" | "violet";
}) {
  const tones = {
    brand: "from-brand-800 to-brand-950 text-gold-300",
    gold: "from-gold-500 to-gold-700 text-brand-950",
    emerald: "from-emerald-600 to-emerald-800 text-emerald-100",
    violet: "from-violet-600 to-violet-900 text-violet-100",
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-brand-950/5">
      <div className={`bg-gradient-to-br px-5 py-4 ${tones[tone]}`}>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
      </div>
      {hint ? (
        <p className="px-5 py-2.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function AdminPanel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-brand-950/5">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-base font-bold text-brand-950">
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {columns.map((col) => (
              <th key={col} className="px-5 py-3 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-slate-50 last:border-0 hover:bg-brand-50/40"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3.5 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const map = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-gold-100 text-gold-800",
    danger: "bg-red-50 text-red-700",
    info: "bg-brand-50 text-brand-800",
    neutral: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}
    >
      {label}
    </span>
  );
}
