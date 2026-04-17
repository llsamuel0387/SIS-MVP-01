import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { AUTH_POLICY } from "@/lib/auth-policy";
import { getClientIp } from "@/lib/security";
import { passwordResetRequestSchema } from "@/lib/validation";
import { ERROR_CODES, errorResponse } from "@/lib/api-error";
import { writeAuditLogForRequest } from "@/lib/audit";
import { requestPasswordResetToken } from "@/lib/auth/request-password-reset.service";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limiter = await consumeRateLimit(`password-reset:${ip}`, AUTH_POLICY.loginRateLimit.perIp.limit, 60_000);
  if (!limiter.ok) {
    return errorResponse(ERROR_CODES.AUTH_RATE_LIMITED);
  }

  let loginId = "";
  try {
    const parsed = passwordResetRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "If the account exists, reset instructions were sent." });
    }
    loginId = parsed.data.loginId;
  } catch {
    return NextResponse.json({ message: "If the account exists, reset instructions were sent." });
  }

  const { userId } = await requestPasswordResetToken({ loginId, clientIp: ip });

  await writeAuditLogForRequest(request, {
    action: "password_reset_request",
    targetType: "USER",
    targetId: userId ?? "anonymous",
    detail: { matchedAccount: Boolean(userId) }
  });

  return NextResponse.json({ message: "If the account exists, reset instructions were sent." });
}
