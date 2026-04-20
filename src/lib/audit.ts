import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/security";

type AuditEvent = {
  actorUserId?: string;
  actorLoginId?: string;
  targetLoginId?: string;
  action:
    | "login"
    | "login_failure"
    | "login_failure_unknown_user"
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
    | "information_change_request_reject"
    | "rate_limit_breach";
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

function formatSessionDate(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const yy = String(kst.getUTCFullYear()).slice(2);
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const min = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd}/${hh}:${min}`;
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

export type AuditLogPage = {
  rows: AuditEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  serverTimezone: string;
};

export async function getAuditLogsPaginated(options: {
  page?: number;
  pageSize?: number;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
  loginId?: string;
}): Promise<AuditLogPage> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 50));
  const skip = (page - 1) * pageSize;
  const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (options.loginId) {
    const exists = await prisma.user.findUnique({ where: { loginId: options.loginId }, select: { id: true } });
    if (!exists) {
      return { rows: [], page, pageSize, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false, serverTimezone };
    }
  }

  const where = {
    ...(options.loginId
      ? { OR: [{ actor: { loginId: options.loginId } }, { targetType: "USER", targetId: options.loginId }] }
      : {}),
    ...(options.action ? { action: options.action } : {}),
    ...(options.dateFrom || options.dateTo
      ? {
          createdAt: {
            ...(options.dateFrom ? { gte: options.dateFrom } : {}),
            ...(options.dateTo ? { lt: options.dateTo } : {})
          }
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { actor: { select: { loginId: true } } }
    }),
    prisma.auditLog.count({ where })
  ]);

  const userTargetIds = [...new Set(rows.filter((r) => r.targetType === "USER").map((r) => r.targetId))];
  const targetUserMap = userTargetIds.length
    ? Object.fromEntries(
        (await prisma.user.findMany({ where: { id: { in: userTargetIds } }, select: { id: true, loginId: true } })).map(
          (u) => [u.id, u.loginId]
        )
      )
    : {};

  const sessionTargetIds = [...new Set(rows.filter((r) => r.targetType === "SESSION").map((r) => r.targetId))];
  const targetSessionMap = sessionTargetIds.length
    ? Object.fromEntries(
        (await prisma.session.findMany({ where: { id: { in: sessionTargetIds } }, select: { id: true, createdAt: true } })).map(
          (s) => [s.id, formatSessionDate(s.createdAt)]
        )
      )
    : {};

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    serverTimezone,
    rows: rows.map((row) => ({
      actorUserId: row.actorUserId ?? undefined,
      actorLoginId: row.actor?.loginId ?? undefined,
      targetLoginId:
        row.targetType === "USER"
          ? (targetUserMap[row.targetId] ?? undefined)
          : row.targetType === "SESSION"
            ? (targetSessionMap[row.targetId] ?? undefined)
            : undefined,
      action: row.action as AuditAction,
      targetType: row.targetType,
      targetId: row.targetId,
      ipAddress: row.ipAddress ?? undefined,
      detail: row.detailJson ? (JSON.parse(row.detailJson) as Record<string, unknown>) : undefined,
      createdAt: row.createdAt.toISOString()
    })),
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}
