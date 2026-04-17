import { STAFF_TIER_LABELS, STAFF_TIERS, type StaffTierCode } from "@/lib/permissions";

export const STAFF_TIER_OPTIONS: StaffTierCode[] = [
  STAFF_TIERS.staff,
  STAFF_TIERS.higherStaff,
  STAFF_TIERS.viceHeadmaster,
  STAFF_TIERS.headmaster
];

export function getStaffTierLabel(tier: StaffTierCode): string {
  return STAFF_TIER_LABELS[tier];
}
