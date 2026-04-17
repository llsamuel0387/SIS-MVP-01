import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { findUserIdByLoginIdInsensitive } from "@/lib/login-id";
import { hashPasswordResetToken } from "@/lib/auth/password-reset-token.helpers";

export type RequestPasswordResetInput = {
  loginId: string;
  clientIp: string;
};

export type RequestPasswordResetResult = {
  userId: string | null;
};

export async function requestPasswordResetToken(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
  const userId = await findUserIdByLoginIdInsensitive(input.loginId);
  if (userId) {
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        requestedIp: input.clientIp
      }
    });
  }

  return { userId };
}
