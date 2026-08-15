import { inventoryAlerts } from "@/lib/admin-data";
import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
  AdminTable,
  StatusPill,
} from "@/components/admin/ui";

export default function AdminInventoryPage() {
  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description="Stock levels and low-inventory alerts."
        action={<AdminPrimaryButton icon="inventory">Adjust stock</AdminPrimaryButton>}
      />
      <AdminPanel title="Stock alerts">
        <AdminTable
          columns={["Product", "SKU", "Qty", "Status"]}
          rows={inventoryAlerts.map((item) => [
            <span key={item.sku} className="font-semibold text-brand-950">
              {item.product}
            </span>,
            item.sku,
            String(item.stock),
            <StatusPill
              key={`${item.sku}-s`}
              label={item.status}
              tone={item.status === "Out" ? "danger" : "warning"}
            />,
          ])}
        />
      </AdminPanel>
    </>
  );
}
