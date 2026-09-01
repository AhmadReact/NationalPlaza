import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/login-form";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: noIndexRobots,
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
