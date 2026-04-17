import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeLoginId } from "@/lib/login-id";
import { isLoginIdUniqueConstraintViolation } from "@/lib/prisma-unique-violation";

export type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

export type UserCreateDb = Pick<PrismaClient, "user">;

/** Thrown inside `prisma.$transaction` when `User.loginId` unique is hit; aborts the transaction. */
export class LoginIdAlreadyExistsError extends Error {
  override readonly name = "LoginIdAlreadyExistsError";

  constructor() {
    super("login_id_exists");
  }
}

/**
 * Creates a user row with normalized `loginId`. Relies on DB `User.loginId @unique` for concurrency safety.
 * Pre-check with `findUserIdByLoginIdInsensitive` is optional (UX); duplicate concurrent creates surface as `login_id_exists`.
 */
export async function createUserWithNormalizedLoginId(input: {
  loginIdFromRequest: string;
  passwordHash: string;
  roleId: string;
}): Promise<{ ok: true; user: UserWithRole } | { ok: false; reason: "login_id_exists" }> {
  try {
    const user = await prisma.user.create({
      data: {
        loginId: normalizeLoginId(input.loginIdFromRequest),
        passwordHash: input.passwordHash,
        roleId: input.roleId,
        status: "ACTIVE",
        mustChangePassword: true
      },
      include: { role: true }
    });
    return { ok: true, user };
  } catch (error) {
    if (isLoginIdUniqueConstraintViolation(error)) {
      return { ok: false, reason: "login_id_exists" };
    }
    throw error;
  }
}

/**
 * Same as {@link createUserWithNormalizedLoginId} but for interactive transactions: throws
 * {@link LoginIdAlreadyExistsError} on unique violation so the enclosing transaction rolls back.
 */
export async function createUserWithNormalizedLoginIdOrThrow(
  db: UserCreateDb,
  input: {
    loginIdFromRequest: string;
    passwordHash: string;
    roleId: string;
  }
): Promise<UserWithRole> {
  try {
    return await db.user.create({
      data: {
        loginId: normalizeLoginId(input.loginIdFromRequest),
        passwordHash: input.passwordHash,
        roleId: input.roleId,
        status: "ACTIVE",
        mustChangePassword: true
      },
      include: { role: true }
    });
  } catch (error) {
    if (isLoginIdUniqueConstraintViolation(error)) {
      throw new LoginIdAlreadyExistsError();
    }
    throw error;
  }
}
