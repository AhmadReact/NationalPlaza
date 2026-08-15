import {
  AdminPageHeader,
  AdminPanel,
  AdminPrimaryButton,
} from "@/components/admin/ui";
import { WhatsAppSettingsCard } from "@/components/admin/whatsapp-settings-card";

const fields = [
  { label: "Store name", value: "National Electronics" },
  { label: "Support email", value: "info@nationalelectronics.pk" },
  { label: "Phone", value: "+92 300 1234567" },
  { label: "Currency", value: "PKR (Rs.)" },
  { label: "Timezone", value: "Asia/Karachi (PKT)" },
  { label: "Order prefix", value: "NE-" },
];

export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Store profile and admin preferences."
        action={<AdminPrimaryButton icon="settings">Save changes</AdminPrimaryButton>}
      />
      <AdminPanel title="General">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.label} className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-950">
                {field.label}
              </span>
              <input
                defaultValue={field.value}
                className="w-full rounded-xl border-2 border-brand-900/10 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-600 focus:bg-white"
              />
            </label>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
          Changes are UI-only in this demo — wire them to your backend when ready.
        </div>
      </AdminPanel>
      <div className="mt-5">
        <WhatsAppSettingsCard />
      </div>
    </>
  );
}
