import { recordLoginAttempt } from "@/lib/login-attempts";
import { verifyPassword } from "@/lib/password";
import { incrementFailedLoginAndMaybeLock, resetFailedLoginAttempts } from "@/lib/login-lockout";
import { createSession, hashSessionToken } from "@/lib/session";
import { checkLoginAccountRateLimit, checkLoginIpRateLimit, loadUserForLoginByLoginId } from "@/lib/auth/login-flow.helpers";
import { prisma } from "@/lib/prisma";

export type LoginFlowSuccess = {
  kind: "success";
  user: {
    id: string;
    loginId: string;
    role: string;
    status: string;
  };
  sessionToken: string;
  sessionId: string;
};

export type LoginFlowFailure =
  | { kind: "rate_limit_ip"; retryAfterMs: number }
  | { kind: "rate_limit_account"; retryAfterMs: number }
  | { kind: "invalid_credentials"; userId?: string }
  | { kind: "inactive_account"; userId: string }
  | { kind: "locked_account"; userId: string; loginId: string }
  | { kind: "invalid_credentials_warn"; userId: string; remainingPasswordAttempts: number };

export type LoginFlowResult = LoginFlowSuccess | LoginFlowFailure;

/**
 * Credential verification, lockout, session issuance. Rate limits + user load are delegated to
 * {@link login-flow.helpers}; cookies / JSON remain in the route handler.
 */
export async function runLoginFlow(input: {
  ip: string;
  loginId: string;
  password: string;
  userAgent?: string;
}): Promise<LoginFlowResult> {
  const { ip, loginId, password, userAgent } = input;

  const ipRateLimit = await checkLoginIpRateLimit(ip);
  if (!ipRateLimit.ok) {
    return { kind: "rate_limit_ip", retryAfterMs: ipRateLimit.retryAfterMs };
  }

  const accountRateLimit = await checkLoginAccountRateLimit(loginId);
  if (!accountRateLimit.ok) {
    return { kind: "rate_limit_account", retryAfterMs: accountRateLimit.retryAfterMs };
  }

  const user = await loadUserForLoginByLoginId(loginId);

  if (!user) {
    await recordLoginAttempt({ key: loginId, success: false, ipAddress: ip, reasonCode: "INVALID_CREDENTIALS" });
    return { kind: "invalid_credentials" };
  }

  if (user.status !== "ACTIVE") {
    await recordLoginAttempt({ key: loginId, success: false, ipAddress: ip, reasonCode: "INACTIVE_ACCOUNT", userId: user.id });
    return { kind: "inactive_account", userId: user.id };
  }

  const matched = await verifyPassword(user.passwordHash, password);
  if (!matched) {
    const lockResult = await incrementFailedLoginAndMaybeLock(user.id);

    await recordLoginAttempt({
      key: loginId,
      success: false,
      ipAddress: ip,
      userId: user.id,
      reasonCode: lockResult.kind === "locked" ? "ACCOUNT_LOCKED_FAILED_LOGINS" : "INVALID_CREDENTIALS"
    });

    if (lockResult.kind === "locked") {
      return { kind: "locked_account", userId: user.id, loginId: user.loginId };
    }

    if (lockResult.kind === "warn") {
      return {
        kind: "invalid_credentials_warn",
        userId: user.id,
        remainingPasswordAttempts: lockResult.remainingPasswordAttempts
      };
    }

    return { kind: "invalid_credentials", userId: user.id };
  }

  await resetFailedLoginAttempts(user.id);
  await recordLoginAttempt({ key: loginId, success: true, ipAddress: ip, userId: user.id });

  const sessionToken = await createSession({
    userId: user.id,
    ipAddress: ip,
    userAgent
  });

  const sessionRow = await prisma.session.findFirst({
    where: { refreshTokenId: hashSessionToken(sessionToken), revokedAt: null },
    select: { id: true }
  });

  return {
    kind: "success",
    user: {
      id: user.id,
      loginId: user.loginId,
      role: user.role.code,
      status: user.status
    },
    sessionToken,
    sessionId: sessionRow?.id ?? ""
  };
}
