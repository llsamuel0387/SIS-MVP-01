import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/security";

type AuditEvent = {
  actorUserId?: string;
  action:
    | "login"
    | "login_failure"
    | "password_reset"
    | "password_reset_request"
    | "user_create"
    | "student_status_change"
    | "account_deactivate"
    | "account_auto_locked_failed_logins"
    | "account_activate"
    | "account_delete"
    | "account_profile_update"
    | "staff_tier_update"
    | "student_enrollment_status_update"
    | "student_segmentation_update"
    | "sso_provider_update"
    | "sso_authorization_start"
    | "session_refresh"
    | "session_logout"
    | "certificate_issue"
    | "information_change_request_create"
    | "information_change_request_approve"
    | "information_change_request_reject";
  targetType: string;
  targetId: string;
  ipAddress?: string;
  detail?: Record<string, unknown>;
  createdAt: string;
};

export type AuditAction = AuditEvent["action"];

function mergeRequestIntoDetail(request: Request, detail?: Record<string, unknown>): Record<string, unknown> | undefined {
  let path = "";
  try {
    path = new URL(request.url).pathname;
  } catch {
    path = "";
  }
  const merged: Record<string, unknown> = {
    ...(detail ?? {}),
    httpMethod: request.method,
    path
  };
  return merged;
}

/** Low-level write. Prefer `writeAuditLogForRequest` from mutating route handlers so `path` / `httpMethod` stay consistent. */
export async function writeAuditLog(event: Omit<AuditEvent, "createdAt">): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId: event.actorUserId ?? null,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      ipAddress: event.ipAddress,
      detailJson: event.detail ? JSON.stringify(event.detail) : null
    }
  });
}

/**
 * 감사 로그 표준: `ipAddress`(미지정 시 요청 IP) + `detail`에 `httpMethod`·`path` 병합.
 * 새 변이 API는 이 함수를 사용하고, CI `npm run check:mutation-audit`로 누락을 검출합니다.
 */
export async function writeAuditLogForRequest(
  request: Request,
  event: Omit<AuditEvent, "createdAt" | "ipAddress"> & { ipAddress?: string }
): Promise<void> {
  await writeAuditLog({
    ...event,
    ipAddress: event.ipAddress ?? getClientIp(request),
    detail: mergeRequestIntoDetail(request, event.detail)
  });
}

export async function getAuditLogs(limit = 200): Promise<AuditEvent[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit
  });
  return rows.map((row) => ({
    actorUserId: row.actorUserId ?? undefined,
    action: row.action as AuditEvent["action"],
    targetType: row.targetType,
    targetId: row.targetId,
    ipAddress: row.ipAddress ?? undefined,
    detail: row.detailJson ? (JSON.parse(row.detailJson) as Record<string, unknown>) : undefined,
    createdAt: row.createdAt.toISOString()
  }));
}
