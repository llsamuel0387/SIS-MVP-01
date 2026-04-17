import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/security";
import { writeAuditLogForRequest } from "@/lib/audit";
import { consumeRateLimit } from "@/lib/rate-limit";
import { AUTH_POLICY } from "@/lib/auth-policy";
import { passwordResetConfirmSchema } from "@/lib/validation";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { confirmPasswordReset } from "@/lib/auth/confirm-password-reset.service";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limiter = await consumeRateLimit(
    `password-reset-confirm:${ip}`,
    AUTH_POLICY.passwordResetConfirmRateLimit.perIp.limit,
    AUTH_POLICY.passwordResetConfirmRateLimit.perIp.windowMs
  );
  if (!limiter.ok) {
    const response = errorResponse(ERROR_CODES.AUTH_RATE_LIMITED);
    response.headers.set("Retry-After", String(Math.ceil(limiter.retryAfterMs / 1000)));
    return response;
  }

  let token: string;
  let password: string;
  try {
    const parsed = passwordResetConfirmSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
    }
    token = parsed.data.token;
    password = parsed.data.newPassword;
  } catch {
    return errorResponse(ERROR_CODES.VALIDATION_INVALID_PAYLOAD);
  }

  const result = await confirmPasswordReset({ token, newPassword: password });
  if (!result.ok) {
    return errorResponse(result.code);
  }

  await writeAuditLogForRequest(request, {
    actorUserId: result.data.userId,
    action: "password_reset",
    targetType: "USER",
    targetId: result.data.userId
  });

  return NextResponse.json({ ok: true });
}
