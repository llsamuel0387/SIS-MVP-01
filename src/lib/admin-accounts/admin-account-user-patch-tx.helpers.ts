import type { Prisma } from "@prisma/client";
import type { UserStatus } from "@prisma/client";
import { buildAccountSearchText } from "@/lib/account-search-text";
import type { StaffTierCode } from "@/lib/permissions";
import { decryptPersonSectionPayload, upsertPersonSection } from "@/lib/person-data";
import { readStudentSegmentationSectionPayload, toStudentSegmentationSectionPayload } from "@/lib/student-segmentation";
import { studentSegmentationPatchSchema } from "@/lib/validation";
import { encryptNullableSensitiveField, toEmailLookupIndex } from "@/lib/pii-field";
import type { AdminAccountUserDetailRecord } from "@/lib/admin-accounts/admin-account-user.helpers";
import type { ParsedPatchProfiles } from "@/lib/admin-accounts/admin-account-user.helpers";

export class DuplicateEmailOnProfileUpdateError extends Error {
  override readonly name = "DuplicateEmailOnProfileUpdateError";

  constructor() {
    super("duplicate_email");
  }
}

type Tx = Prisma.TransactionClient;

export async function applySegmentationPatchInTx(
  tx: Tx,
  person: NonNullable<AdminAccountUserDetailRecord["person"]>,
  segmentationInput: unknown
): Promise<void> {
  const parsedSegmentation = studentSegmentationPatchSchema.parse(segmentationInput);
  const existingSection = person.sections.find((section) => section.sectionKey === "student-segmentation.v1");
  const currentSegmentation = existingSection
    ? readStudentSegmentationSectionPayload(decryptPersonSectionPayload(existingSection))
    : readStudentSegmentationSectionPayload(null);
  const nextDepartment = parsedSegmentation.department ?? currentSegmentation.values.department;
  const nextPathway = parsedSegmentation.pathway ?? currentSegmentation.values.pathway;
  await upsertPersonSection(
    {
      personId: person.id,
      sectionKey: "student-segmentation.v1",
      payload: toStudentSegmentationSectionPayload({
        department: nextDepartment,
        pathway: nextPathway,
        classes: currentSegmentation.values.classes
      })
    },
    tx
  );
  await tx.student.updateMany({
    where: { userId: person.userId },
    data: {
      segmentationDepartment: nextDepartment || null,
      segmentationPathway: nextPathway || null
    }
  });
}

export async function applyProfilePatchInTx(
  tx: Tx,
  params: {
    userId: string;
    target: AdminAccountUserDetailRecord;
    parsed: ParsedPatchProfiles;
  }
): Promise<void> {
  const { userId, target, parsed } = params;
  const profileData = parsed.student ?? parsed.staff!;
  const termTimeAddress = parsed.student?.termTimeAddress;
  const homeAddress = parsed.student?.homeAddress;

  const duplicateEmail = await tx.userProfile.findFirst({
    where: {
      OR: [{ email: toEmailLookupIndex(profileData.email) }, { email: profileData.email }],
      userId: { not: userId }
    },
    select: { userId: true }
  });
  if (duplicateEmail) {
    throw new DuplicateEmailOnProfileUpdateError();
  }

  await tx.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      firstNameKo: encryptNullableSensitiveField(profileData.firstNameKo) ?? "-",
      lastNameKo: encryptNullableSensitiveField(profileData.lastNameKo) ?? "-",
      firstNameEn: encryptNullableSensitiveField(profileData.firstName),
      middleNameEn: encryptNullableSensitiveField(profileData.middleName),
      lastNameEn: encryptNullableSensitiveField(profileData.lastName),
      nationality: encryptNullableSensitiveField(profileData.nationality),
      dateOfBirth: null,
      email: toEmailLookupIndex(profileData.email),
      termCountry: encryptNullableSensitiveField(termTimeAddress?.country),
      termAddressLine1: encryptNullableSensitiveField(termTimeAddress?.addressLine1),
      termAddressLine2: encryptNullableSensitiveField(termTimeAddress?.addressLine2),
      termPostCode: encryptNullableSensitiveField(termTimeAddress?.postCode),
      homeCountry: encryptNullableSensitiveField(homeAddress?.country),
      homeAddressLine1: encryptNullableSensitiveField(homeAddress?.addressLine1),
      homeAddressLine2: encryptNullableSensitiveField(homeAddress?.addressLine2),
      homePostCode: encryptNullableSensitiveField(homeAddress?.postCode)
    },
    update: {
      firstNameKo: encryptNullableSensitiveField(profileData.firstNameKo) ?? "-",
      lastNameKo: encryptNullableSensitiveField(profileData.lastNameKo) ?? "-",
      firstNameEn: encryptNullableSensitiveField(profileData.firstName),
      middleNameEn: encryptNullableSensitiveField(profileData.middleName),
      lastNameEn: encryptNullableSensitiveField(profileData.lastName),
      nationality: encryptNullableSensitiveField(profileData.nationality),
      dateOfBirth: null,
      email: toEmailLookupIndex(profileData.email),
      termCountry: encryptNullableSensitiveField(termTimeAddress?.country),
      termAddressLine1: encryptNullableSensitiveField(termTimeAddress?.addressLine1),
      termAddressLine2: encryptNullableSensitiveField(termTimeAddress?.addressLine2),
      termPostCode: encryptNullableSensitiveField(termTimeAddress?.postCode),
      homeCountry: encryptNullableSensitiveField(homeAddress?.country),
      homeAddressLine1: encryptNullableSensitiveField(homeAddress?.addressLine1),
      homeAddressLine2: encryptNullableSensitiveField(homeAddress?.addressLine2),
      homePostCode: encryptNullableSensitiveField(homeAddress?.postCode)
    }
  });
  await tx.user.update({
    where: { id: userId },
    data: {
      accountSearchText: buildAccountSearchText({
        loginId: target.loginId,
        firstNameKo: profileData.firstNameKo,
        lastNameKo: profileData.lastNameKo,
        firstNameEn: profileData.firstName,
        middleNameEn: profileData.middleName,
        lastNameEn: profileData.lastName
      })
    }
  });

  let personId = target.person?.id;
  if (!personId) {
    const person = await tx.person.create({
      data: {
        userId: target.id,
        type: target.role.code === "STUDENT" ? "STUDENT" : "STAFF"
      }
    });
    personId = person.id;
  }

  await upsertPersonSection(
    {
      personId,
      sectionKey: "identity.v1",
      payload: {
        firstNameKo: profileData.firstNameKo,
        lastNameKo: profileData.lastNameKo,
        firstNameEn: profileData.firstName,
        middleNameEn: profileData.middleName ?? "",
        lastNameEn: profileData.lastName,
        nationality: profileData.nationality,
        dateOfBirth: profileData.dateOfBirth,
        email: profileData.email
      }
    },
    tx
  );

  if (target.role.code === "STUDENT" && termTimeAddress && homeAddress) {
    await upsertPersonSection(
      {
        personId,
        sectionKey: "student-address.v1",
        payload: {
          termTimeAddress,
          homeAddress
        }
      },
      tx
    );
  }
}

export async function applyUserControlFieldsInTx(
  tx: Tx,
  params: {
    userId: string;
    body: {
      status?: string;
      staffTier?: string;
      enrollmentStatus?: string;
    };
    validStatus: boolean;
  }
): Promise<void> {
  const { userId, body, validStatus } = params;
  if (!validStatus && !body.staffTier && !body.enrollmentStatus) {
    return;
  }

  const userData: Prisma.UserUpdateInput = {
    ...(validStatus
      ? {
          status: body.status as UserStatus,
          ...(body.status === "ACTIVE" ? { failedLoginAttempts: 0 } : {})
        }
      : {}),
    ...(body.enrollmentStatus
      ? {
          student: {
            update: {
              enrollmentStatus: body.enrollmentStatus === "ENROLLED" ? "ENROLLED" : "WITHDRAWN"
            }
          }
        }
      : {})
  };

  if (Object.keys(userData).length > 0) {
    await tx.user.update({
      where: { id: userId },
      data: userData
    });
  }

  /** Staff tier on `User` nested update can throw opaquely; `Staff` row update is explicit. */
  if (body.staffTier) {
    await tx.staff.update({
      where: { userId },
      data: { staffTier: body.staffTier as StaffTierCode }
    });
  }
}
