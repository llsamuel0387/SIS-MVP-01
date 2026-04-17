import type { AuditAction } from "@/lib/audit";
import type { SessionUser } from "@/lib/authz";
import { hasPermission } from "@/lib/authz";
import { ERROR_CODES } from "@/lib/api-error";
import type { Prisma } from "@prisma/client";
import type { StaffTierCode } from "@/lib/permissions";
import { PERMISSIONS, ROLES, STAFF_TIERS } from "@/lib/permissions";
import { getDisplayNameFromUser } from "@/lib/user-admin";
import {
  adminStaffProfileUpdateSchema,
  adminStudentProfileUpdateSchema,
  studentSegmentationPatchSchema
} from "@/lib/validation";
import { buildAdminAccountUserDetailProfileBlock, extractPhotoDataUrlFromPersonSections } from "@/lib/user-profile-read-dto";
import type { AdminAccountUserPatchBody } from "@/lib/admin-accounts/patch-admin-account.schema";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type AdminAccountUserDetailRecord = Prisma.UserGetPayload<{
  include: {
    role: true;
    staff: true;
    student: true;
    profile: true;
    person: { include: { sections: true } };
  };
}>;

export type AdminAccountPatchUpdatedRecord = Prisma.UserGetPayload<{
  include: { role: true; staff: true; student: true };
}>;

export function enrollmentLabelFromStudent(
  student: { enrollmentStatus: string } | null | undefined
): "ENROLLED" | "NOT_ENROLLED" | null {
  if (!student) {
    return null;
  }
  return student.enrollmentStatus === "ENROLLED" ? "ENROLLED" : "NOT_ENROLLED";
}

export function assembleAdminAccountUserDetailJson(
  target: AdminAccountUserDetailRecord,
  permissions: string[]
): {
  id: string;
  loginId: string;
  role: string;
  staffTier: string | null;
  status: string;
  enrollmentStatus: "ENROLLED" | "NOT_ENROLLED" | null;
  name: string;
  photoDataUrl: string | null;
  permissions: string[];
  profile: ReturnType<typeof buildAdminAccountUserDetailProfileBlock> | null;
} {
  const sections = target.person?.sections;
  return {
    id: target.id,
    loginId: target.loginId,
    role: target.role.code,
    staffTier: target.staff?.staffTier ?? null,
    status: target.status,
    enrollmentStatus: enrollmentLabelFromStudent(target.student),
    name: getDisplayNameFromUser(target.profile, target.person) || "-",
    photoDataUrl: extractPhotoDataUrlFromPersonSections(sections),
    permissions,
    profile: target.profile ? buildAdminAccountUserDetailProfileBlock(target.profile, sections) : null
  };
}

export function buildPatchAdminAccountResponseJson(updated: AdminAccountPatchUpdatedRecord) {
  return {
    id: updated.id,
    loginId: updated.loginId,
    role: updated.role.code,
    status: updated.status,
    staffTier: updated.staff?.staffTier ?? null,
    enrollmentStatus: enrollmentLabelFromStudent(updated.student)
  };
}

export function buildPatchAdminAccountAudit(
  body: AdminAccountUserPatchBody,
  updated: AdminAccountPatchUpdatedRecord
): { action: AuditAction; detail: Record<string, unknown> } {
  const action: AuditAction =
    body.profile !== undefined
      ? "account_profile_update"
      : body.segmentation !== undefined
        ? "student_segmentation_update"
        : body.staffTier !== undefined
          ? "staff_tier_update"
          : body.enrollmentStatus !== undefined
            ? "student_enrollment_status_update"
            : body.status === "ACTIVE"
              ? "account_activate"
              : "account_deactivate";

  const detail: Record<string, unknown> = {
    loginId: updated.loginId,
    role: updated.role.code,
    status: updated.status,
    staffTier: updated.staff?.staffTier ?? null,
    enrollmentStatus: enrollmentLabelFromStudent(updated.student),
    ...(body.status === "ACTIVE" ? { resetFailedLoginAttempts: true } : {})
  };

  return { action, detail };
}

export type ParsedPatchProfiles = {
  student: ReturnType<typeof adminStudentProfileUpdateSchema.parse> | null;
  staff: ReturnType<typeof adminStaffProfileUpdateSchema.parse> | null;
};

export function parsePatchProfilePayload(
  targetRole: string,
  profileUnknown: unknown
): { ok: true; parsed: ParsedPatchProfiles } | { ok: false; code: ErrorCode } {
  if (targetRole === "STUDENT") {
    const r = adminStudentProfileUpdateSchema.safeParse(profileUnknown);
    if (!r.success) {
      return { ok: false, code: ERROR_CODES.VALIDATION_INVALID_PAYLOAD };
    }
    return { ok: true, parsed: { student: r.data, staff: null } };
  }
  const r = adminStaffProfileUpdateSchema.safeParse(profileUnknown);
  if (!r.success) {
    return { ok: false, code: ERROR_CODES.VALIDATION_INVALID_PAYLOAD };
  }
  return { ok: true, parsed: { student: null, staff: r.data } };
}

export function validatePatchEnumFields(body: AdminAccountUserPatchBody): ErrorCode | null {
  const validStatus = body.status === "ACTIVE" || body.status === "INACTIVE";
  const validEnrollmentStatus = body.enrollmentStatus === "ENROLLED" || body.enrollmentStatus === "NOT_ENROLLED";
  const validStaffTier =
    body.staffTier === undefined || Object.values(STAFF_TIERS).includes(body.staffTier as StaffTierCode);

  if (
    (!validStatus && body.status !== undefined) ||
    (!validEnrollmentStatus && body.enrollmentStatus !== undefined) ||
    !validStaffTier
  ) {
    return ERROR_CODES.ACCOUNT_INVALID_STATUS;
  }
  return null;
}

export function validatePatchAgainstTargetAndActor(
  actor: SessionUser,
  target: AdminAccountUserDetailRecord,
  body: AdminAccountUserPatchBody,
  hasProfilePayload: boolean
): ErrorCode | null {
  if (body.staffTier && target.role.code !== "STAFF") {
    return ERROR_CODES.VALIDATION_INVALID_PAYLOAD;
  }
  if (body.enrollmentStatus && target.role.code !== "STUDENT") {
    return ERROR_CODES.VALIDATION_INVALID_PAYLOAD;
  }
  if (body.segmentation && target.role.code !== "STUDENT") {
    return ERROR_CODES.VALIDATION_INVALID_PAYLOAD;
  }
  if (hasProfilePayload && target.role.code !== "STUDENT" && target.role.code !== "STAFF") {
    return ERROR_CODES.VALIDATION_INVALID_PAYLOAD;
  }
  if (hasProfilePayload && !hasPermission(actor, PERMISSIONS.userUpdate)) {
    return ERROR_CODES.AUTH_FORBIDDEN;
  }
  if (body.enrollmentStatus) {
    const actorCanManageEnrollment =
      actor.role === ROLES.admin || actor.staffTier === STAFF_TIERS.headmaster || actor.staffTier === STAFF_TIERS.viceHeadmaster;
    if (!actorCanManageEnrollment) {
      return ERROR_CODES.AUTH_FORBIDDEN;
    }
  }
  return null;
}

export function validateSegmentationPayload(body: AdminAccountUserPatchBody): ErrorCode | null {
  if (body.segmentation === undefined) {
    return null;
  }
  const seg = studentSegmentationPatchSchema.safeParse(body.segmentation);
  if (!seg.success) {
    return ERROR_CODES.VALIDATION_INVALID_PAYLOAD;
  }
  return null;
}
