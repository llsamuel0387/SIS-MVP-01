import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { AUTH_POLICY } from "@/lib/auth-policy";
import { getClientIp } from "@/lib/security";
import { ssoStartSchema } from "@/lib/validation";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { writeAuditLogForRequest } from "@/lib/audit";
import { startSsoAuthorizationFlow } from "@/lib/sso/start-sso-authorization-flow.service";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limiter = await consumeRateLimit(
    `sso-start:${ip}`,
    AUTH_POLICY.ssoStartRateLimit.perIp.limit,
    AUTH_POLICY.ssoStartRateLimit.perIp.windowMs
  );
  if (!limiter.ok) {
    const response = errorResponse(ERROR_CODES.AUTH_RATE_LIMITED);
    response.headers.set("Retry-After", String(Math.ceil(limiter.retryAfterMs / 1000)));
    return response;
  }

  let provider: "MICROSOFT" | "ONELOGIN";
  try {
    const parsed = ssoStartSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(ERROR_CODES.AUTH_INVALID_PAYLOAD);
    }
    provider = parsed.data.provider;
  } catch {
    return errorResponse(ERROR_CODES.AUTH_INVALID_PAYLOAD);
  }

  const flow = await startSsoAuthorizationFlow({ provider });
  if (!flow.ok) {
    return errorResponse(flow.code);
  }

  const response = NextResponse.json({
    ok: true,
    data: {
      provider: flow.data.provider,
      authorizationUrl: flow.data.authorizationUrl
    }
  });
  response.cookies.set("sso_state", flow.data.state, {
    httpOnly: true,
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/api/auth/sso"
  });
  response.cookies.set("sso_nonce", flow.data.nonce, {
    httpOnly: true,
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/api/auth/sso"
  });

  await writeAuditLogForRequest(request, {
    action: "sso_authorization_start",
    targetType: "SSO_PROVIDER",
    targetId: provider,
    detail: {}
  });

  return response;
}
