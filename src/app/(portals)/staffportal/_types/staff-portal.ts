import type { PermissionCode, StaffTierCode } from "@/lib/permissions";
import type { StudentSegmentationConfig } from "@/lib/student-segmentation";
import type { PortalEntityDetail } from "@/app/(portals)/_types/portal-my-information";

export type StaffMe = {
  id: string;
  role: "STAFF";
  staffId?: string;
  staffTier?: StaffTierCode | null;
  permissions: PermissionCode[];
};

export type StaffStudentRow = {
  id: string;
  name: string;
  studentNo: string;
  department: string;
  pathway: string;
  status: string;
};

export type StaffMemberRow = {
  id: string;
  name: string;
  staffNo: string;
  department: string | null;
  pathway: string;
  status: string;
  staffTier: StaffTierCode;
};

export type StaffEntityDetail = PortalEntityDetail;

export type SegmentationConfigForm = StudentSegmentationConfig;
