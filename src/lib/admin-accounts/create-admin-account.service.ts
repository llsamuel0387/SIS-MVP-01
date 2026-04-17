import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import { hashPassword } from "@/lib/password";
import { findUserIdByLoginIdInsensitive } from "@/lib/login-id";
import { getRolePermissions } from "@/lib/user-admin";
import { LoginIdAlreadyExistsError, type UserWithRole } from "@/lib/create-user-with-login-unique";
import { prepareOptionalProfilePhoto, type AdminAccountCreateBody, type PersonSectionWrite } from "@/lib/admin-accounts/create-admin-account.helpers";
import { runCreateAccountCoreInTransaction } from "@/lib/admin-accounts/create-account-tx.helpers";

export type CreateAdminAccountResult =
  | { ok: true; user: UserWithRole; permissions: string[] }
  | {
      ok: false;
      errorCode:
        | typeof ERROR_CODES.ACCOUNT_ALREADY_EXISTS
        | typeof ERROR_CODES.VALIDATION_INVALID_PAYLOAD
        | typeof ERROR_CODES.ACCOUNT_ROLE_NOT_CONFIGURED;
    };

export type CreateAdminAccountInput = {
  body: AdminAccountCreateBody;
  passwordHash: string;
  roleId?: string;
  extraPersonSectionWrites?: PersonSectionWrite[];
};

export async function preflightAndCreateAdminAccount(input: CreateAdminAccountInput): Promise<CreateAdminAccountResult> {
  const existingId = await findUserIdByLoginIdInsensitive(input.body.loginId);
  if (existingId) {
    return { ok: false, errorCode: ERROR_CODES.ACCOUNT_ALREADY_EXISTS };
  }
  return createAdminAccountInTransaction(input);
}

export type CreateAdminAccountWithPlainPasswordResult =
  | (Extract<CreateAdminAccountResult, { ok: true }> & { passwordHashLength: number })
  | Extract<CreateAdminAccountResult, { ok: false }>;

export async function preflightAndCreateAdminAccountWithPlainPassword(
  body: AdminAccountCreateBody
): Promise<CreateAdminAccountWithPlainPasswordResult> {
  const passwordHash = await hashPassword(body.password);
  const result = await preflightAndCreateAdminAccount({ body, passwordHash });
  if (!result.ok) {
    return result;
  }
  return { ...result, passwordHashLength: passwordHash.length };
}

export async function createAdminAccountInTransaction(input: CreateAdminAccountInput): Promise<CreateAdminAccountResult> {
  const { body, passwordHash, extraPersonSectionWrites } = input;

  let roleId = input.roleId;
  if (!roleId) {
    const roleRow = await prisma.role.findUnique({ where: { code: body.role } });
    if (!roleRow) {
      return { ok: false, errorCode: ERROR_CODES.ACCOUNT_ROLE_NOT_CONFIGURED };
    }
    roleId = roleRow.id;
  }

  const preparedPhoto =
    "profile" in body ? await prepareOptionalProfilePhoto(body.profile.photoPngBase64) : ({ kind: "absent" } as const);

  if (preparedPhoto.kind === "invalid") {
    return { ok: false, errorCode: ERROR_CODES.VALIDATION_INVALID_PAYLOAD };
  }

  try {
    const user = await prisma.$transaction(async (tx) =>
      runCreateAccountCoreInTransaction(tx, {
        body,
        passwordHash,
        roleId,
        preparedPhoto,
        extraPersonSectionWrites
      })
    );

    const permissions = await getRolePermissions(user.roleId);
    return { ok: true, user, permissions };
  } catch (error) {
    if (error instanceof LoginIdAlreadyExistsError) {
      return { ok: false, errorCode: ERROR_CODES.ACCOUNT_ALREADY_EXISTS };
    }
    throw error;
  }
}
