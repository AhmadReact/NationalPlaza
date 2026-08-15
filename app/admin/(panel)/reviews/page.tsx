import { reviewQueue } from "@/lib/admin-data";
import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  StatusPill,
} from "@/components/admin/ui";

export default function AdminReviewsPage() {
  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="Moderate customer product reviews."
      />
      <AdminPanel title="Review queue">
        <AdminTable
          columns={["Product", "Customer", "Rating", "Excerpt", "Status"]}
          rows={reviewQueue.map((r, i) => [
            <span key={i} className="font-semibold text-brand-950">
              {r.product}
            </span>,
            r.customer,
            `${r.rating}/5`,
            r.excerpt,
            <StatusPill
              key={`${i}-s`}
              label={r.status}
              tone={r.status === "Published" ? "success" : "warning"}
            />,
          ])}
        />
      </AdminPanel>
    </>
  );
}
