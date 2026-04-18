import { NextResponse } from "next/server";
import { parseCookies } from "@/lib/http";
import { getClientIp } from "@/lib/security";
import { writeAuditLogForRequest } from "@/lib/audit";
import { getSessionCookieName } from "@/lib/session";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { refreshSessionForApi, refreshSessionErrorCode } from "@/lib/auth/refresh-session.service";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const cookies = parseCookies(request);
    const sessionToken = cookies[getSessionCookieName()];

    const outcome = await refreshSessionForApi({
      clientIp,
      sessionToken,
      userAgent: request.headers.get("user-agent") ?? undefined
    });

    if (!outcome.ok) {
      if (outcome.kind === "rate_limited") {
        const response = errorResponse(refreshSessionErrorCode(outcome));
        response.headers.set("Retry-After", String(Math.ceil(outcome.retryAfterMs / 1000)));
        return response;
      }
      return errorResponse(refreshSessionErrorCode(outcome));
    }

    if (outcome.priorSession?.userId) {
      await writeAuditLogForRequest(request, {
        actorUserId: outcome.priorSession.userId,
        action: "session_refresh",
        targetType: "SESSION",
        targetId: outcome.nextSession?.id ?? outcome.priorSession.id,
        detail: { priorSessionId: outcome.priorSession.id }
      });
    }

    const response = NextResponse.json({
      sessionExpiresIn: outcome.sessionExpiresIn
    });
    response.cookies.set(getSessionCookieName(), outcome.nextSessionToken, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: "lax",
      maxAge: outcome.sessionExpiresIn,
      path: "/"
    });
    response.cookies.set("csrf_token", outcome.csrfToken, {
      httpOnly: false,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: "strict",
      maxAge: outcome.sessionExpiresIn,
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("[api/auth/refresh POST]", error);
    return errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
