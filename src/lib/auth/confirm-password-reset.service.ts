import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import { hashPassword } from "@/lib/password";
import { invalidateAllUserSessions } from "@/lib/session";
import { hashPasswordResetToken } from "@/lib/auth/password-reset-token.helpers";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type ConfirmPasswordResetInput = {
  token: string;
  newPassword: string;
};

export type ConfirmPasswordResetSuccess = {
  userId: string;
  loginId: string;
};

export async function confirmPasswordReset(
  input: ConfirmPasswordResetInput
): Promise<{ ok: true; data: ConfirmPasswordResetSuccess } | { ok: false; code: ErrorCode }> {
  const tokenHash = hashPasswordResetToken(input.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { loginId: true } } }
  });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return { ok: false, code: ERROR_CODES.AUTH_INVALID_PAYLOAD as ErrorCode };
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, mustChangePassword: false }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    })
  ]);

  await invalidateAllUserSessions(resetToken.userId);

  return { ok: true, data: { userId: resetToken.userId, loginId: resetToken.user.loginId } };
}
