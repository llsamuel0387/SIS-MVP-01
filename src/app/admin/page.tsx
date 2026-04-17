import { requireRolePageGuard } from "@/lib/server-route-guard";
import AdminPageShell from "@/app/admin/_components/admin-page-shell";
import AdminDashboardActions from "@/app/admin/_components/admin-dashboard-actions";

export default async function AdminHomePage() {
  await requireRolePageGuard("ADMIN", "/admin/login");

  return (
    <AdminPageShell
      heroBadge="Admin Console"
      heroTitle="Account Administration"
      heroDescription="Create accounts and manage access policies."
    >
      <AdminDashboardActions />
    </AdminPageShell>
  );
}
