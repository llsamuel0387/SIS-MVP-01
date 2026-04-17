const PERMISSION_LABELS: Record<string, string> = {
  "profile.view.self": "View Own Profile",
  "student.view.self": "View Own Student Record",
  "student.view.assigned": "View Assigned Students",
  "student.view.all": "View All Students",
  "student.status.update.assigned": "Update Assigned Student Status",
  "student.update.all": "Update All Student Records",
  "student.note.create": "Create Student Notes",
  "certificate.issue.self": "Issue Own Certificates",
  "certificate.view.self": "View Own Certificates",
  "certificate.view.assigned": "View Assigned Student Certificates",
  "certificate.manage": "Manage Certificates",
  "staff.view.self": "View Own Staff Record",
  "staff.view.all": "View All Staff Records",
  "staff.update.all": "Update All Staff Records",
  "student.segmentation.manage": "Manage Student Segmentation Labels and Options",
  "user.create": "Create Users",
  "user.update": "Update Users",
  "user.disable": "Disable/Enable Users",
  "user.reset_password": "Reset User Passwords",
  "role.manage": "Manage Roles",
  "permission.manage": "Manage Permissions",
  "notice.view.student": "View Student Notices",
  "notice.view.staff": "View Staff Notices",
  "notice.manage": "Manage Notices",
  "audit.view": "View Audit Logs"
};

const PERMISSION_ORDER: string[] = [
  "profile.view.self",
  "student.view.self",
  "student.view.assigned",
  "student.view.all",
  "student.status.update.assigned",
  "student.update.all",
  "student.note.create",
  "certificate.issue.self",
  "certificate.view.self",
  "certificate.view.assigned",
  "certificate.manage",
  "staff.view.self",
  "staff.view.all",
  "staff.update.all",
  "student.segmentation.manage",
  "user.create",
  "user.update",
  "user.disable",
  "user.reset_password",
  "role.manage",
  "permission.manage",
  "notice.view.student",
  "notice.view.staff",
  "notice.manage",
  "audit.view"
];

const PERMISSION_ORDER_INDEX = new Map(PERMISSION_ORDER.map((code, index) => [code, index]));

export function formatPermissionLabel(code: string): string {
  return PERMISSION_LABELS[code] ?? code;
}

export function sortPermissionCodes(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    const ai = PERMISSION_ORDER_INDEX.get(a);
    const bi = PERMISSION_ORDER_INDEX.get(b);
    if (ai !== undefined && bi !== undefined) {
      return ai - bi;
    }
    if (ai !== undefined) {
      return -1;
    }
    if (bi !== undefined) {
      return 1;
    }
    return a.localeCompare(b);
  });
}
