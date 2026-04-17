import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  STAFF_TIER_PERMISSION_GRANTS,
  type PermissionCode,
  type RoleCode,
  ROLES,
  type StaffTierCode
} from "@/lib/permissions";

export class ForbiddenError extends Error {
  override readonly name = "ForbiddenError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type SessionUser = {
  id: string;
  role: RoleCode;
  studentId?: string;
  staffId?: string;
  staffTier?: StaffTierCode;
  assignedStudentIds?: string[];
  permissions?: PermissionCode[];
};

export function getEffectivePermissions(user: SessionUser): PermissionCode[] {
  const basePermissions = user.permissions ?? DEFAULT_ROLE_PERMISSIONS[user.role];
  if (user.role !== ROLES.staff || !user.staffTier) {
    return basePermissions;
  }

  const tierPermissions = STAFF_TIER_PERMISSION_GRANTS[user.staffTier] ?? [];
  return Array.from(new Set([...basePermissions, ...tierPermissions]));
}

export function hasPermission(user: SessionUser, permission: PermissionCode): boolean {
  return getEffectivePermissions(user).includes(permission);
}

export function assertCanAccessStudent(user: SessionUser, studentId: string): void {
  if (user.role === ROLES.admin && hasPermission(user, PERMISSIONS.studentViewAll)) {
    return;
  }

  if (user.role === ROLES.student && user.studentId === studentId) {
    return;
  }

  if (user.role === ROLES.staff && hasPermission(user, PERMISSIONS.studentViewAll)) {
    return;
  }

  if (
    user.role === ROLES.staff &&
    hasPermission(user, PERMISSIONS.studentViewAssigned) &&
    user.assignedStudentIds?.includes(studentId)
  ) {
    return;
  }

  throw new ForbiddenError("Forbidden: student access denied");
}

export function assertCanAccessStaff(user: SessionUser, staffId: string): void {
  if (user.role === ROLES.admin && hasPermission(user, PERMISSIONS.staffViewAll)) {
    return;
  }

  if (user.role === ROLES.staff && hasPermission(user, PERMISSIONS.staffViewAll)) {
    return;
  }

  if (user.role === ROLES.staff && user.staffId === staffId && hasPermission(user, PERMISSIONS.staffViewSelf)) {
    return;
  }

  throw new ForbiddenError("Forbidden: staff access denied");
}

export function assertCanIssueEnrollmentCertificate(user: SessionUser, studentId: string): void {
  if (user.role === ROLES.admin && hasPermission(user, PERMISSIONS.certificateManage)) {
    return;
  }

  if (
    user.role === ROLES.student &&
    user.studentId === studentId &&
    hasPermission(user, PERMISSIONS.certificateIssueSelf)
  ) {
    return;
  }

  throw new ForbiddenError("Forbidden: certificate issue denied");
}
