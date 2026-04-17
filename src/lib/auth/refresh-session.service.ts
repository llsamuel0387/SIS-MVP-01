import { consumeRateLimit } from "@/lib/rate-limit";
import { AUTH_POLICY } from "@/lib/auth-policy";
import { getActiveSessionByToken, rotateSession, SESSION_POLICY } from "@/lib/session";
import { createCsrfToken } from "@/lib/http";
import { ERROR_CODES } from "@/lib/api-error";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type RefreshSessionInput = {
  clientIp: string;
  sessionToken: string | undefined;
  userAgent: string | undefined;
};

export type RefreshSessionResult =
  | { ok: false; kind: "rate_limited"; retryAfterMs: number }
  | { ok: false; kind: "session_missing" }
  | { ok: false; kind: "session_invalid" }
  | { ok: false; kind: "session_refresh_invalid" }
  | {
      ok: true;
      nextSessionToken: string;
      csrfToken: string;
      sessionExpiresIn: number;
      priorSession: { id: string; userId: string } | null;
      nextSession: { id: string; userId: string } | null;
    };

/** Single linear refresh pipeline; split this file if device binding / step-up adds branches. */
export async function refreshSessionForApi(input: RefreshSessionInput): Promise<RefreshSessionResult> {
  const limiter = await consumeRateLimit(
    `session-refresh:${input.clientIp}`,
    AUTH_POLICY.sessionRefreshRateLimit.perIp.limit,
    AUTH_POLICY.sessionRefreshRateLimit.perIp.windowMs
  );
  if (!limiter.ok) {
    return { ok: false, kind: "rate_limited", retryAfterMs: limiter.retryAfterMs };
  }

  if (!input.sessionToken) {
    return { ok: false, kind: "session_missing" };
  }

  const priorSession = await getActiveSessionByToken(input.sessionToken);

  try {
    const nextSessionToken = await rotateSession(input.sessionToken, {
      ipAddress: input.clientIp,
      userAgent: input.userAgent
    });
    if (!nextSessionToken) {
      return { ok: false, kind: "session_invalid" };
    }

    const nextSession = await getActiveSessionByToken(nextSessionToken);

    return {
      ok: true,
      nextSessionToken,
      csrfToken: createCsrfToken(),
      sessionExpiresIn: SESSION_POLICY.maxAgeSeconds,
      priorSession,
      nextSession
    };
  } catch {
    return { ok: false, kind: "session_refresh_invalid" };
  }
}

export function refreshSessionErrorCode(result: Extract<RefreshSessionResult, { ok: false }>): ErrorCode {
  switch (result.kind) {
    case "rate_limited":
      return ERROR_CODES.AUTH_RATE_LIMITED as ErrorCode;
    case "session_missing":
      return ERROR_CODES.AUTH_SESSION_MISSING as ErrorCode;
    case "session_invalid":
      return ERROR_CODES.AUTH_SESSION_INVALID as ErrorCode;
    case "session_refresh_invalid":
      return ERROR_CODES.AUTH_SESSION_REFRESH_INVALID as ErrorCode;
    default:
      return ERROR_CODES.AUTH_SESSION_REFRESH_INVALID as ErrorCode;
  }
}
