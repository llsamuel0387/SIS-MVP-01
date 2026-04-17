import { redirect } from "next/navigation";
import { requireRolePageGuard } from "@/lib/server-route-guard";
import { canManageDepartmentPathwaySettings } from "@/lib/department-pathway-policy";
import PortalHomeShell from "@/app/(portals)/_components/portal-home-shell";
import { STAFF_PORTAL_INTERNAL_CONFIG } from "@/app/(portals)/_config/portal-internal-config";
import { getStaffInternalNavigationLinks } from "@/app/(portals)/staffportal/_config/staff-internal-navigation";
import StaffSegmentationSettingsPage from "@/app/(portals)/staffportal/_components/staff-segmentation-settings-page";

export default async function StaffSegmentationSettingsEntryPage() {
  const sessionUser = await requireRolePageGuard("STAFF", "/staffportal/login");

  if (!canManageDepartmentPathwaySettings({ role: sessionUser.role, staffTier: sessionUser.staffTier })) {
    redirect("/staffportal");
  }

  return (
    <PortalHomeShell {...STAFF_PORTAL_INTERNAL_CONFIG} links={getStaffInternalNavigationLinks(sessionUser)}>
      <StaffSegmentationSettingsPage />
    </PortalHomeShell>
  );
}
