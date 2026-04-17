import { requireRolePageGuard } from "@/lib/server-route-guard";
import PortalHomeShell from "@/app/(portals)/_components/portal-home-shell";
import { STAFF_PORTAL_INTERNAL_CONFIG } from "@/app/(portals)/_config/portal-internal-config";
import StaffMembersPage from "@/app/(portals)/staffportal/_components/staff-members-page";
import { getStaffInternalNavigationLinks } from "@/app/(portals)/staffportal/_config/staff-internal-navigation";

export default async function StaffInformationPage() {
  const sessionUser = await requireRolePageGuard("STAFF", "/staffportal/login");

  return (
    <PortalHomeShell {...STAFF_PORTAL_INTERNAL_CONFIG} links={getStaffInternalNavigationLinks(sessionUser)}>
      <StaffMembersPage />
    </PortalHomeShell>
  );
}
