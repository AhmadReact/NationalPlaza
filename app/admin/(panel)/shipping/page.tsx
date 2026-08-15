import { shippingZones } from "@/lib/admin-data";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  AdminTable,
  StatusPill,
} from "@/components/admin/ui";

export default function AdminShippingPage() {
  return (
    <>
      <AdminPageHeader
        title="Shipping"
        description="Delivery zones, rates, and ETAs across Pakistan."
        action={<AdminPrimaryButton>Add zone</AdminPrimaryButton>}
      />
      <AdminPanel title="Shipping zones">
        <AdminTable
          columns={["Zone", "Rate", "ETA", "Status"]}
          rows={shippingZones.map((z) => [
            <span key={z.zone} className="font-semibold text-brand-950">
              {z.zone}
            </span>,
            z.rate,
            z.eta,
            <StatusPill key={`${z.zone}-s`} label="Enabled" tone="success" />,
          ])}
        />
      </AdminPanel>
    </>
  );
}
