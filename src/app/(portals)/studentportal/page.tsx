import { requireRolePageGuard } from "@/lib/server-route-guard";
import PortalHomeShell from "@/app/(portals)/_components/portal-home-shell";
import { STUDENT_PORTAL_INTERNAL_CONFIG } from "@/app/(portals)/_config/portal-internal-config";
import StudentPortalDashboard from "@/app/(portals)/studentportal/_components/student-portal-dashboard";

export default async function StudentPortalEntryPage() {
  await requireRolePageGuard("STUDENT", "/studentportal/login");

  return (
    <PortalHomeShell {...STUDENT_PORTAL_INTERNAL_CONFIG}>
      <StudentPortalDashboard />
    </PortalHomeShell>
  );
}
