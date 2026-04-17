export const ROLES = {
  student: "STUDENT",
  staff: "STAFF",
  admin: "ADMIN"
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export const STAFF_TIERS = {
  staff: "STAFF",
  higherStaff: "HIGHER_STAFF",
  viceHeadmaster: "VICE_HEADMASTER",
  headmaster: "HEADMASTER"
} as const;

export type StaffTierCode = (typeof STAFF_TIERS)[keyof typeof STAFF_TIERS];

export const STAFF_TIER_LABELS: Record<StaffTierCode, string> = {
  STAFF: "staff",
  HIGHER_STAFF: "higher staff",
  VICE_HEADMASTER: "Vice-headmaster",
  HEADMASTER: "headmaster"
};

export const PERMISSIONS = {
  profileViewSelf: "profile.view.self",
  studentViewSelf: "student.view.self",
  studentViewAssigned: "student.view.assigned",
  studentViewAll: "student.view.all",
  studentStatusUpdateAssigned: "student.status.update.assigned",
  studentUpdateAll: "student.update.all",
  studentNoteCreate: "student.note.create",
  certificateIssueSelf: "certificate.issue.self",
  certificateViewSelf: "certificate.view.self",
  certificateViewAssigned: "certificate.view.assigned",
  certificateManage: "certificate.manage",
  staffViewSelf: "staff.view.self",
  staffViewAll: "staff.view.all",
  staffUpdateAll: "staff.update.all",
  studentSegmentationManage: "student.segmentation.manage",
  userCreate: "user.create",
  userUpdate: "user.update",
  userDisable: "user.disable",
  userResetPassword: "user.reset_password",
  roleManage: "role.manage",
  permissionManage: "permission.manage",
  noticeViewStudent: "notice.view.student",
  noticeViewStaff: "notice.view.staff",
  noticeManage: "notice.manage",
  auditView: "audit.view"
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const STAFF_TIER_PERMISSION_GRANTS: Record<StaffTierCode, PermissionCode[]> = {
  STAFF: [PERMISSIONS.studentViewAll, PERMISSIONS.staffViewAll],
  HIGHER_STAFF: [PERMISSIONS.studentViewAll, PERMISSIONS.staffViewAll],
  VICE_HEADMASTER: [PERMISSIONS.studentViewAll, PERMISSIONS.staffViewAll, PERMISSIONS.studentSegmentationManage],
  HEADMASTER: [PERMISSIONS.studentViewAll, PERMISSIONS.staffViewAll, PERMISSIONS.studentSegmentationManage]
};

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  STUDENT: [
    PERMISSIONS.profileViewSelf,
    PERMISSIONS.studentViewSelf,
    PERMISSIONS.certificateIssueSelf,
    PERMISSIONS.certificateViewSelf,
    PERMISSIONS.noticeViewStudent
  ],
  STAFF: [
    PERMISSIONS.staffViewSelf,
    PERMISSIONS.studentViewAssigned,
    PERMISSIONS.studentStatusUpdateAssigned,
    PERMISSIONS.studentNoteCreate,
    PERMISSIONS.certificateViewAssigned,
    PERMISSIONS.noticeViewStaff
  ],
  ADMIN: Object.values(PERMISSIONS)
};
