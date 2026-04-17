import crypto from "crypto";
import type { SessionUser } from "@/lib/authz";
import type { PermissionCode } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  getCachedSessionUser,
  invalidateSessionCacheByTokenHash,
  invalidateSessionCacheByUserId,
  setCachedSessionUser
} from "@/lib/session-cache";

const SESSION_COOKIE_NAME = "session_token";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
const MIN_SESSION_MAX_AGE_SECONDS = 60 * 30; // 30 minutes
const MAX_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

function readSessionMaxAgeSeconds(): number {
  const raw = process.env.SESSION_MAX_AGE_SECONDS?.trim();
  if (!raw) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }
  return Math.min(Math.max(parsed, MIN_SESSION_MAX_AGE_SECONDS), MAX_SESSION_MAX_AGE_SECONDS);
}

export const SESSION_POLICY = {
  get maxAgeSeconds(): number {
    return readSessionMaxAgeSeconds();
  }
} as const;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashSessionToken(token: string): string {
  return sha256(token);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export async function createSession(input: { userId: string; ipAddress?: string; userAgent?: string }): Promise<string> {
  const token = crypto.randomBytes(48).toString("base64url");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_POLICY.maxAgeSeconds * 1000);

  await prisma.session.create({
    data: {
      userId: input.userId,
      refreshTokenId: tokenHash,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      expiresAt
    }
  });

  return token;
}

export async function invalidateSessionByToken(token: string): Promise<void> {
  const tokenHash = sha256(token);
  await prisma.session.updateMany({
    where: {
      refreshTokenId: tokenHash,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
  invalidateSessionCacheByTokenHash(tokenHash);
}

/** 로그아웃·리프레시 감사 등: 토큰으로 활성 세션 id·userId만 조회 (권한/조인 없음). */
export async function getActiveSessionByToken(
  token: string
): Promise<{ id: string; userId: string } | null> {
  const tokenHash = sha256(token);
  return prisma.session.findFirst({
    where: {
      refreshTokenId: tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    select: { id: true, userId: true }
  });
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  invalidateSessionCacheByUserId(userId);
}

/** Revokes all active sessions for the user except the one matching `exceptTokenHash` (SHA-256 of the raw session token). */
export async function invalidateOtherUserSessions(userId: string, exceptTokenHash: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      refreshTokenId: { not: exceptTokenHash }
    },
    data: { revokedAt: new Date() }
  });
  invalidateSessionCacheByUserId(userId);
}

export async function rotateSession(token: string, input?: { ipAddress?: string; userAgent?: string }): Promise<string | null> {
  const tokenHash = sha256(token);
  const session = await prisma.session.findFirst({
    where: {
      refreshTokenId: tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  });
  if (!session) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() }
  });

  invalidateSessionCacheByTokenHash(tokenHash);

  return createSession({
    userId: session.userId,
    ipAddress: input?.ipAddress ?? session.ipAddress ?? undefined,
    userAgent: input?.userAgent ?? session.userAgent ?? undefined
  });
}

export async function getSessionUserFromToken(token: string): Promise<SessionUser | null> {
  const tokenHash = sha256(token);
  const cached = getCachedSessionUser(tokenHash);
  if (cached !== undefined) {
    return cached;
  }

  const record = await prisma.session.findFirst({
    where: {
      refreshTokenId: tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true }
              }
            }
          },
          student: {
            select: { id: true }
          },
          staff: {
            include: {
              assignments: { select: { studentId: true } }
            }
          }
        }
      }
    }
  });

  if (!record) {
    setCachedSessionUser(tokenHash, null);
    return null;
  }

  const user: SessionUser = {
    id: record.user.id,
    role: record.user.role.code as SessionUser["role"],
    studentId: record.user.student?.id,
    staffId: record.user.staff?.id,
    staffTier:
      record.user.staff &&
      typeof record.user.staff === "object" &&
      "staffTier" in record.user.staff &&
      typeof record.user.staff.staffTier === "string"
        ? (record.user.staff.staffTier as SessionUser["staffTier"])
        : undefined,
    assignedStudentIds: record.user.staff?.assignments.map((row) => row.studentId) ?? [],
    permissions: record.user.role.rolePermissions.map((row) => row.permission.code as PermissionCode)
  };
  setCachedSessionUser(tokenHash, user);
  return user;
}
