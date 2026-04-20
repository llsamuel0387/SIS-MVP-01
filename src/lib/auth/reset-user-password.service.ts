import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import { hashPassword, verifyPassword } from "@/lib/password";
import { hashSessionToken, invalidateAllUserSessions, invalidateOtherUserSessions } from "@/lib/session";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type ResetUserPasswordInput = {
  actorUserId: string;
  actorHasUserResetPasswordPermission: boolean;
  targetUserId: string;
  newPassword: string;
  currentPassword?: string;
  sessionToken: string | null;
};

export async function resetUserPassword(
  input: ResetUserPasswordInput
): Promise<{ ok: true; data: { targetUserId: string; targetLoginId: string } } | { ok: false; code: ErrorCode; fields?: { path: string; message: string }[] }> {
  if (!input.actorHasUserResetPasswordPermission && input.actorUserId !== input.targetUserId) {
    return { ok: false, code: ERROR_CODES.AUTH_FORBIDDEN as ErrorCode };
  }

  const isSelf = input.actorUserId === input.targetUserId;
  if (isSelf) {
    if (!input.currentPassword?.length) {
      return {
        ok: false,
        code: ERROR_CODES.VALIDATION_INVALID_PAYLOAD as ErrorCode,
        fields: [{ path: "currentPassword", message: "Current password is required." }]
      };
    }
    const targetUser = await prisma.user.findUnique({
      where: { id: input.targetUserId },
      select: { passwordHash: true }
    });
    if (!targetUser || !(await verifyPassword(targetUser.passwordHash, input.currentPassword))) {
      return {
        ok: false,
        code: ERROR_CODES.VALIDATION_INVALID_PAYLOAD as ErrorCode,
        fields: [{ path: "currentPassword", message: "Current password is incorrect." }]
      };
    }
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: input.targetUserId },
    data: {
      passwordHash,
      mustChangePassword: false
    }
  });

  if (isSelf) {
    if (input.sessionToken) {
      await invalidateOtherUserSessions(input.targetUserId, hashSessionToken(input.sessionToken));
    } else {
      await invalidateAllUserSessions(input.targetUserId);
    }
  } else {
    await invalidateAllUserSessions(input.targetUserId);
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { loginId: true }
  });

  return { ok: true, data: { targetUserId: input.targetUserId, targetLoginId: updatedUser?.loginId ?? input.targetUserId } };
}
