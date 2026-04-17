import { ROLES, STAFF_TIERS, type RoleCode, type StaffTierCode } from "@/lib/permissions";

export const DEPARTMENT_PATHWAY_MANAGER_TIERS: StaffTierCode[] = [
  STAFF_TIERS.viceHeadmaster,
  STAFF_TIERS.headmaster
];

export function canManageDepartmentPathwaySettings(input: {
  role: RoleCode;
  staffTier?: StaffTierCode | null;
}): boolean {
  if (input.role !== ROLES.staff) {
    return false;
  }
  if (!input.staffTier) {
    return false;
  }
  return DEPARTMENT_PATHWAY_MANAGER_TIERS.includes(input.staffTier);
}
