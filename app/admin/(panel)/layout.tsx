import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { ADMIN_COOKIE, ADMIN_DEMO } from "@/lib/admin-auth";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const session = jar.get(ADMIN_COOKIE)?.value;

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminShell adminName={session || ADMIN_DEMO.name}>{children}</AdminShell>
  );
}
