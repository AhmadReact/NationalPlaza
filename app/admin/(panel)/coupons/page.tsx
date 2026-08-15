import { coupons } from "@/lib/admin-data";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  AdminTable,
  StatusPill,
} from "@/components/admin/ui";

export default function AdminCouponsPage() {
  return (
    <>
      <AdminPageHeader
        title="Coupons"
        description="Discount codes and promotional offers."
        action={<AdminPrimaryButton>Create coupon</AdminPrimaryButton>}
      />
      <AdminPanel title="Promo codes">
        <AdminTable
          columns={["Code", "Discount", "Uses", "Status"]}
          rows={coupons.map((c) => [
            <span
              key={c.code}
              className="font-mono font-semibold text-brand-950"
            >
              {c.code}
            </span>,
            c.discount,
            String(c.uses),
            <StatusPill
              key={`${c.code}-s`}
              label={c.status}
              tone={c.status === "Active" ? "success" : "neutral"}
            />,
          ])}
        />
      </AdminPanel>
    </>
  );
}
