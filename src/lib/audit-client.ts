import { secureFetchJson } from "@/lib/parse-fetch-response-json";

export const AUDIT_ACTIONS = [
  "login",
  "login_failure",
  "login_failure_unknown_user",
  "password_reset",
  "password_reset_request",
  "user_create",
  "student_status_change",
  "account_deactivate",
  "account_auto_locked_failed_logins",
  "account_activate",
  "account_delete",
  "account_profile_update",
  "staff_tier_update",
  "student_enrollment_status_update",
  "student_segmentation_update",
  "sso_provider_update",
  "sso_authorization_start",
  "session_refresh",
  "session_logout",
  "certificate_issue",
  "information_change_request_create",
  "information_change_request_approve",
  "information_change_request_reject",
  "rate_limit_breach"
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditLogRow = {
  actorUserId?: string;
  actorLoginId?: string;
  targetLoginId?: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  ipAddress?: string;
  detail?: Record<string, unknown>;
  createdAt: string;
};

export type AuditLogPage = {
  rows: AuditLogRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  serverTimezone: string;
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  login: "Login",
  login_failure: "Login Failure",
  login_failure_unknown_user: "Unknown ID Login",
  password_reset: "Password Reset",
  password_reset_request: "PW Reset Request",
  user_create: "User Created",
  student_status_change: "Student Status",
  account_deactivate: "Account Deactivated",
  account_auto_locked_failed_logins: "Auto Locked",
  account_activate: "Account Activated",
  account_delete: "Account Deleted",
  account_profile_update: "Profile Updated",
  staff_tier_update: "Staff Tier Updated",
  student_enrollment_status_update: "Enrollment Updated",
  student_segmentation_update: "Segmentation Updated",
  sso_provider_update: "SSO Updated",
  sso_authorization_start: "SSO Start",
  session_refresh: "Session Refresh",
  session_logout: "Logout",
  certificate_issue: "Certificate Issued",
  information_change_request_create: "Info Request",
  information_change_request_approve: "Info Approved",
  information_change_request_reject: "Info Rejected",
  rate_limit_breach: "Rate Limit Breach"
};

export type ActionSeverity = "danger" | "warning" | "success" | "info" | "neutral";

export const AUDIT_ACTION_SEVERITY: Record<AuditAction, ActionSeverity> = {
  rate_limit_breach: "danger",
  account_auto_locked_failed_logins: "danger",
  account_delete: "danger",
  login_failure: "warning",
  login_failure_unknown_user: "warning",
  account_deactivate: "warning",
  information_change_request_reject: "warning",
  login: "success",
  account_activate: "success",
  information_change_request_approve: "success",
  user_create: "info",
  password_reset: "info",
  password_reset_request: "info",
  sso_provider_update: "info",
  sso_authorization_start: "info",
  certificate_issue: "info",
  session_refresh: "neutral",
  session_logout: "neutral",
  account_profile_update: "neutral",
  staff_tier_update: "neutral",
  student_enrollment_status_update: "neutral",
  student_segmentation_update: "neutral",
  student_status_change: "neutral",
  information_change_request_create: "neutral"
};

export async function fetchAuditLogs(params: {
  page?: number;
  pageSize?: number;
  action?: AuditAction | "";
  dateFrom?: string;
  dateTo?: string;
  loginId?: string;
}): Promise<{ ok: boolean; data: AuditLogPage }> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.action) query.set("action", params.action);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.loginId) query.set("loginId", params.loginId);
  const qs = query.toString();
  return secureFetchJson<AuditLogPage>(`/api/admin/audit${qs ? `?${qs}` : ""}`);
}
