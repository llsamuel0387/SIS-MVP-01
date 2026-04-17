import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";
import { canManageDepartmentPathwaySettings as canManageDepartmentPathwaySettingsPolicy } from "@/lib/department-pathway-policy";
import type { StaffMe } from "@/app/(portals)/staffportal/_types/staff-portal";

export function canViewStudentsByPermissions(permissions: PermissionCode[]): boolean {
  return permissions.includes(PERMISSIONS.studentViewAssigned) || permissions.includes(PERMISSIONS.studentViewAll);
}

export function canViewStaffByPermissions(permissions: PermissionCode[]): boolean {
  return permissions.includes(PERMISSIONS.staffViewAll) || permissions.includes(PERMISSIONS.staffViewSelf);
}

export function canManageSegmentationByPermissions(permissions: PermissionCode[]): boolean {
  return permissions.includes(PERMISSIONS.studentSegmentationManage);
}

export function canManageDepartmentPathwaySettings(me: StaffMe | null): boolean {
  if (!me) {
    return false;
  }
  return canManageDepartmentPathwaySettingsPolicy({ role: me.role, staffTier: me.staffTier });
}
