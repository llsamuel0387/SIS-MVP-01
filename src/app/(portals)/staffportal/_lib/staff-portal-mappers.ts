import type { PortalEntityDetail } from "@/app/(portals)/_types/portal-my-information";
import type { StaffMemberDetailResponse, StaffStudentDetailResponse } from "@/app/(portals)/staffportal/_lib/staff-portal-client";

export function toStudentEntityDetail(detail: StaffStudentDetailResponse): PortalEntityDetail {
  return {
    id: detail.id,
    entityType: "STUDENT",
    name: detail.name,
    numberLabel: "Student Number",
    numberValue: detail.studentNo || "",
    roleLabel: "STUDENT",
    status: detail.status,
    photoDataUrl: detail.photoDataUrl ?? null,
    profile: detail.profile
  };
}

export function toStaffEntityDetail(detail: StaffMemberDetailResponse): PortalEntityDetail {
  return {
    id: detail.id,
    entityType: "STAFF",
    name: detail.name,
    numberLabel: "Staff Number",
    numberValue: detail.staffNo || "",
    roleLabel: detail.roleLabel || "STAFF",
    status: detail.status,
    photoDataUrl: detail.photoDataUrl ?? null,
    profile: detail.profile
  };
}
