import { Prisma } from "@prisma/client";

/**
 * Prisma P2002 (unique constraint failed). `meta.target` shape differs by provider / Prisma version.
 * Generic helper: every listed field name must appear in `meta.target`.
 */
export function isUniqueConstraintOnFields(error: unknown, fieldNames: string[]): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  const names = new Set<string>();
  if (Array.isArray(target)) {
    for (const t of target) {
      if (typeof t === "string") {
        names.add(t);
      }
    }
  } else if (typeof target === "string") {
    names.add(target);
  }
  if (names.size === 0) {
    return false;
  }
  return fieldNames.every((f) => names.has(f));
}

/**
 * True only when P2002 is for **`User.loginId` alone** (single-column unique).
 * Composite uniques that include `loginId` together with other columns must **not** map to `ACCOUNT_ALREADY_EXISTS`.
 */
export function isLoginIdUniqueConstraintViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.length === 1 && target[0] === "loginId";
  }
  if (typeof target === "string") {
    return target === "loginId";
  }
  return false;
}
