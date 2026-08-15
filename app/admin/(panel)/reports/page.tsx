import { reportSummary, topProducts } from "@/lib/admin-data";
import { formatPrice } from "@/lib/data";
import {
  AdminPageHeader,
  AdminPanel,
  StatCard,
  AdminTable,
} from "@/components/admin/ui";

export default function AdminReportsPage() {
  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Sales performance and catalog insights."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportSummary.map((item, i) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            tone={(["brand", "gold", "emerald", "violet"] as const)[i]}
          />
        ))}
      </div>
      <AdminPanel title="Best sellers this month">
        <AdminTable
          columns={["Product", "Units sold", "Revenue"]}
          rows={topProducts.map((p) => [
            <span key={p.name} className="font-semibold text-brand-950">
              {p.name}
            </span>,
            String(p.sold),
            formatPrice(p.revenue),
          ])}
        />
      </AdminPanel>
    </>
  );
}
