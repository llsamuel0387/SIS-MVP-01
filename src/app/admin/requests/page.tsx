import { requireRolePageGuard } from "@/lib/server-route-guard";
import AdminInformationRequestsPageClient from "@/app/admin/information-requests/_components/admin-information-requests-page-client";

export default async function AdminRequestsPage() {
  await requireRolePageGuard("ADMIN", "/admin/login");
  return <AdminInformationRequestsPageClient />;
}
