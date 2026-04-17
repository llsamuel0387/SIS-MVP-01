import { consumeRateLimit } from "@/lib/rate-limit";
import { AUTH_POLICY } from "@/lib/auth-policy";
import { prisma } from "@/lib/prisma";
import { findUserIdByLoginIdInsensitive } from "@/lib/login-id";

export async function checkLoginIpRateLimit(ip: string) {
  return consumeRateLimit(
    `login:ip:${ip}`,
    AUTH_POLICY.loginRateLimit.perIp.limit,
    AUTH_POLICY.loginRateLimit.perIp.windowMs
  );
}

export async function checkLoginAccountRateLimit(loginId: string) {
  return consumeRateLimit(
    `login:acct:${loginId.toLowerCase()}`,
    AUTH_POLICY.loginRateLimit.perAccount.limit,
    AUTH_POLICY.loginRateLimit.perAccount.windowMs
  );
}

export async function loadUserForLoginByLoginId(loginId: string) {
  const matchedUserId = await findUserIdByLoginIdInsensitive(loginId);
  if (!matchedUserId) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: matchedUserId },
    include: { role: true }
  });
}
