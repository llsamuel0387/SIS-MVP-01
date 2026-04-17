import type { Prisma } from "@prisma/client";
import { createUserWithNormalizedLoginIdOrThrow, type UserWithRole } from "@/lib/create-user-with-login-unique";
import { upsertPersonSection } from "@/lib/person-data";
import {
  buildOptionalPhotoSectionWrite,
  buildRequiredPersonSectionWrites,
  buildUserProfileUncheckedCreateInput,
  mergePersonSectionWrites,
  type AdminAccountCreateBody,
  type PersonSectionWrite,
  type PreparedProfilePhoto
} from "@/lib/admin-accounts/create-admin-account.helpers";

type Tx = Prisma.TransactionClient;

/**
 * Core account creation writes inside an interactive transaction (caller supplies `tx`).
 */
export async function runCreateAccountCoreInTransaction(
  tx: Tx,
  input: {
    body: AdminAccountCreateBody;
    passwordHash: string;
    roleId: string;
    preparedPhoto: PreparedProfilePhoto;
    extraPersonSectionWrites?: PersonSectionWrite[];
  }
): Promise<UserWithRole> {
  const { body, passwordHash, roleId, preparedPhoto, extraPersonSectionWrites } = input;

  const createdUser = await createUserWithNormalizedLoginIdOrThrow(tx, {
    loginIdFromRequest: body.loginId,
    passwordHash,
    roleId
  });

  if ("profile" in body) {
    await tx.userProfile.create({
      data: buildUserProfileUncheckedCreateInput(createdUser.id, body)
    });

    const person = await tx.person.create({
      data: {
        userId: createdUser.id,
        type: body.role === "STUDENT" ? "STUDENT" : "STAFF"
      }
    });

    const requiredWrites = buildRequiredPersonSectionWrites(body, person.id);
    const allWrites = mergePersonSectionWrites(requiredWrites, extraPersonSectionWrites);
    for (const write of allWrites) {
      await upsertPersonSection(write, tx);
    }

    if (preparedPhoto.kind === "ready") {
      await upsertPersonSection(buildOptionalPhotoSectionWrite(person.id, preparedPhoto.imagePngBase64), tx);
    }
  }

  if (body.role === "STUDENT") {
    await tx.student.create({
      data: {
        userId: createdUser.id,
        studentNo: `S-${Date.now()}`,
        enrollmentStatus: "ENROLLED"
      }
    });
  }

  if (body.role === "STAFF") {
    await tx.staff.create({
      data: {
        userId: createdUser.id,
        employeeNo: `T-${Date.now()}`,
        staffTier: body.profile.staffTier,
        employmentStatus: "ACTIVE"
      }
    });
  }

  return createdUser;
}
