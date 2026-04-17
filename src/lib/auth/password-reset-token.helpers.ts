import crypto from "crypto";

export function hashPasswordResetToken(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
