import { Suspense } from "react";
import { requireRolePageGuard } from "@/lib/server-route-guard";
import AuditLogPageClient from "@/app/admin/audit/_components/audit-log-page-client";

export default async function AuditLogPage() {
  await requireRolePageGuard("ADMIN", "/admin/login");
  return (
    <Suspense>
      <AuditLogPageClient />
    </Suspense>
  );
}
