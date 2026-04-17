import { prisma } from "@/lib/prisma";
import { AUTH_POLICY } from "@/lib/auth-policy";
import { invalidateAllUserSessions } from "@/lib/session";

const { maxFailedAttempts, minFailuresToShowRemaining } = AUTH_POLICY.failedLoginLockout;

export type FailedLoginIncrementResult =
  | { kind: "locked"; userId: string }
  | { kind: "warn"; userId: string; failedAttempts: number; remainingPasswordAttempts: number }
  | { kind: "silent"; userId: string; failedAttempts: number };

type TxResult =
  | { outcome: "locked"; failedAttempts: number }
  | { outcome: "warn"; failedAttempts: number; remainingPasswordAttempts: number }
  | { outcome: "silent"; failedAttempts: number };

/**
 * Atomically increments failed login attempts for an active user.
 * At `maxFailedAttempts`, sets status to INACTIVE, resets the counter, and revokes sessions.
 */
export async function incrementFailedLoginAndMaybeLock(userId: string): Promise<FailedLoginIncrementResult> {
  const r = await prisma.$transaction(async (tx): Promise<TxResult> => {
    const row = await tx.user.update({
      where: { id: userId, status: "ACTIVE" },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true }
    });

    const failedAttempts = row.failedLoginAttempts;

    if (failedAttempts >= maxFailedAttempts) {
      await tx.user.update({
        where: { id: userId },
        data: { status: "INACTIVE", failedLoginAttempts: 0 }
      });
      return { outcome: "locked", failedAttempts };
    }

    if (failedAttempts >= minFailuresToShowRemaining && failedAttempts < maxFailedAttempts) {
      return {
        outcome: "warn",
        failedAttempts,
        remainingPasswordAttempts: maxFailedAttempts + 1 - failedAttempts
      };
    }

    return { outcome: "silent", failedAttempts };
  });

  if (r.outcome === "locked") {
    await invalidateAllUserSessions(userId);
    return { kind: "locked", userId };
  }

  if (r.outcome === "warn") {
    return {
      kind: "warn",
      userId,
      failedAttempts: r.failedAttempts,
      remainingPasswordAttempts: r.remainingPasswordAttempts
    };
  }

  return { kind: "silent", userId, failedAttempts: r.failedAttempts };
}

export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0 }
  });
}
