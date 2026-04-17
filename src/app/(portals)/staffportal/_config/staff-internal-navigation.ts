import type { SessionUser } from "@/lib/authz";
import { getEffectivePermissions } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { canManageDepartmentPathwaySettings } from "@/lib/department-pathway-policy";

type StaffInternalLink = { href: string; label: string };

export function getStaffInternalNavigationLinks(user: SessionUser): StaffInternalLink[] {
  const permissions = getEffectivePermissions(user);

  const links: StaffInternalLink[] = [{ href: "/staffportal", label: "Staff Home" }];

  if (permissions.includes(PERMISSIONS.studentViewAssigned) || permissions.includes(PERMISSIONS.studentViewAll)) {
    links.push({ href: "/staffportal/students", label: "Student Information" });
  }

  if (permissions.includes(PERMISSIONS.staffViewSelf) || permissions.includes(PERMISSIONS.staffViewAll)) {
    links.push({ href: "/staffportal/staff", label: "Staff Information" });
  }

  if (canManageDepartmentPathwaySettings({ role: user.role, staffTier: user.staffTier })) {
    links.push({ href: "/staffportal/segmentation-settings", label: "Department.Pathway Settings" });
  }

  return links;
}
