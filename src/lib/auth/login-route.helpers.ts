import { writeAuditLogForRequest } from "@/lib/audit";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { getSessionCookieName, SESSION_POLICY } from "@/lib/session";
import type { LoginFlowFailure, LoginFlowResult, LoginFlowSuccess } from "@/lib/auth/login-flow.service";
import { createCsrfToken } from "@/lib/http";
import { NextResponse } from "next/server";

export function isLoginFlowSuccess(flow: LoginFlowResult): flow is LoginFlowSuccess {
  return flow.kind === "success";
}

export async function writeLoginFlowFailureAudits(request: Request, flow: LoginFlowFailure, loginId: string): Promise<void> {
  switch (flow.kind) {
    case "invalid_credentials":
      await writeAuditLogForRequest(request, {
        actorUserId: flow.userId,
        action: flow.userId ? "login_failure" : "login_failure_unknown_user",
        targetType: "USER",
        targetId: loginId
      });
      return;
    case "inactive_account":
      await writeAuditLogForRequest(request, {
        actorUserId: flow.userId,
        action: "login_failure",
        targetType: "USER",
        targetId: loginId
      });
      return;
    case "locked_account":
      await writeAuditLogForRequest(request, {
        actorUserId: flow.userId,
        action: "login_failure",
        targetType: "USER",
        targetId: flow.loginId
      });
      await writeAuditLogForRequest(request, {
        actorUserId: flow.userId,
        action: "account_auto_locked_failed_logins",
        targetType: "USER",
        targetId: flow.loginId
      });
      return;
    case "invalid_credentials_warn":
      await writeAuditLogForRequest(request, {
        actorUserId: flow.userId,
        action: "login_failure",
        targetType: "USER",
        targetId: loginId
      });
      return;
    default:
      return;
  }
}

export function loginFlowFailureToHttpResponse(flow: LoginFlowFailure): NextResponse {
  if (flow.kind === "rate_limit_ip" || flow.kind === "rate_limit_account") {
    const response = errorResponse(ERROR_CODES.AUTH_RATE_LIMITED);
    response.headers.set("Retry-After", String(Math.ceil(flow.retryAfterMs / 1000)));
    return response;
  }
  if (flow.kind === "invalid_credentials_warn") {
    return errorResponse(ERROR_CODES.AUTH_INVALID_CREDENTIALS, {
      remainingPasswordAttempts: flow.remainingPasswordAttempts
    });
  }
  if (flow.kind === "inactive_account" || flow.kind === "locked_account") {
    return errorResponse(ERROR_CODES.AUTH_ACCOUNT_DEACTIVATED);
  }
  return errorResponse(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
}

export async function buildLoginSuccessResponse(flow: LoginFlowSuccess): Promise<NextResponse> {
  const response = NextResponse.json({
    ok: true,
    data: {
      accessTokenExpiresIn: SESSION_POLICY.maxAgeSeconds,
      user: {
        id: flow.user.id,
        loginId: flow.user.loginId,
        role: flow.user.role,
        status: flow.user.status
      }
    }
  });
  const csrfToken = await createCsrfToken(flow.sessionToken);
  response.cookies.set(getSessionCookieName(), flow.sessionToken, {
    httpOnly: true,
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "lax",
    maxAge: SESSION_POLICY.maxAgeSeconds,
    path: "/"
  });
  response.cookies.set("csrf_token", csrfToken, {
    httpOnly: false,
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "strict",
    maxAge: SESSION_POLICY.maxAgeSeconds,
    path: "/"
  });
  return response;
}

/** Maps `runLoginFlow` outcome to audits + HTTP (keeps `route.ts` free of flow-kind branching). */
export async function finalizeLoginPostResponse(
  request: Request,
  flow: LoginFlowResult,
  loginId: string
): Promise<NextResponse> {
  if (isLoginFlowSuccess(flow)) {
    await writeAuditLogForRequest(request, {
      actorUserId: flow.user.id,
      action: "login",
      targetType: "SESSION",
      targetId: flow.sessionId
    });
    return await buildLoginSuccessResponse(flow);
  }

  if (flow.kind === "rate_limit_ip" || flow.kind === "rate_limit_account") {
    await writeAuditLogForRequest(request, {
      action: "rate_limit_breach",
      targetType: "AUTH",
      targetId: loginId,
      detail: { kind: flow.kind, retryAfterMs: flow.retryAfterMs }
    });
    return loginFlowFailureToHttpResponse(flow);
  }

  await writeLoginFlowFailureAudits(request, flow, loginId);
  return loginFlowFailureToHttpResponse(flow);
}
