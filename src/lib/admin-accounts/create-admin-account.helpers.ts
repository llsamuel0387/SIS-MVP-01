import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { sanitizeImageUploadBase64 } from "@/lib/photo-security";
import type { UserWithRole } from "@/lib/create-user-with-login-unique";
import { toStudentSegmentationSectionPayload } from "@/lib/student-segmentation";
import { userCreateWithProfileSchema } from "@/lib/validation";
import { encryptNullableSensitiveField, toEmailLookupIndex } from "@/lib/pii-field";
import { sanitizeUserRecord } from "@/lib/user-admin";

export type AdminAccountCreateBody = z.infer<typeof userCreateWithProfileSchema>;

export type PersonSectionWrite = {
  personId: string;
  sectionKey: string;
  payload: Record<string, unknown>;
};

export type PreparedProfilePhoto =
  | { kind: "absent" }
  | { kind: "ready"; imagePngBase64: string }
  | { kind: "invalid" };

/**
 * Optional profile photo: validate only when the client sent a value.
 * Invalid uploads are reported upstream so we never start a DB transaction (no orphan User).
 */
export async function prepareOptionalProfilePhoto(photoPngBase64: string | undefined): Promise<PreparedProfilePhoto> {
  if (photoPngBase64 === undefined || photoPngBase64 === "") {
    return { kind: "absent" };
  }
  try {
    const imagePngBase64 = await sanitizeImageUploadBase64(photoPngBase64);
    return { kind: "ready", imagePngBase64 };
  } catch {
    return { kind: "invalid" };
  }
}

/** Core `UserProfile` row for STUDENT/STAFF admin creates (encrypted columns + email index). */
export function buildUserProfileUncheckedCreateInput(
  userId: string,
  body: Extract<AdminAccountCreateBody, { profile: unknown }>
): Prisma.UserProfileUncheckedCreateInput {
  const { profile } = body;
  return {
    userId,
    firstNameKo: encryptNullableSensitiveField(profile.firstNameKo) ?? "",
    lastNameKo: encryptNullableSensitiveField(profile.lastNameKo) ?? "",
    firstNameEn: encryptNullableSensitiveField(profile.firstName),
    middleNameEn: encryptNullableSensitiveField(profile.middleName),
    lastNameEn: encryptNullableSensitiveField(profile.lastName),
    photoUrl: null,
    nationality: encryptNullableSensitiveField(profile.nationality),
    dateOfBirth: null,
    email: toEmailLookupIndex(profile.email),
    ...(body.role === "STUDENT"
      ? (() => {
          const studentBody = body as Extract<AdminAccountCreateBody, { role: "STUDENT" }>;
          const sp = studentBody.profile;
          return {
            termCountry: encryptNullableSensitiveField(sp.termTimeAddress.country),
            termAddressLine1: encryptNullableSensitiveField(sp.termTimeAddress.addressLine1),
            termAddressLine2: encryptNullableSensitiveField(sp.termTimeAddress.addressLine2),
            termPostCode: encryptNullableSensitiveField(sp.termTimeAddress.postCode),
            homeCountry: encryptNullableSensitiveField(sp.homeAddress.country),
            homeAddressLine1: encryptNullableSensitiveField(sp.homeAddress.addressLine1),
            homeAddressLine2: encryptNullableSensitiveField(sp.homeAddress.addressLine2),
            homePostCode: encryptNullableSensitiveField(sp.homeAddress.postCode)
          };
        })()
      : {})
  };
}

/**
 * Person sections that must exist for a coherent STUDENT/STAFF account (identity + student-only blocks).
 * Photo is handled separately via {@link buildOptionalPhotoSectionWrite}.
 */
export function buildRequiredPersonSectionWrites(
  body: Extract<AdminAccountCreateBody, { profile: unknown }>,
  personId: string
): PersonSectionWrite[] {
  const { profile } = body;
  const identity: PersonSectionWrite = {
    personId,
    sectionKey: "identity.v1",
    payload: {
      firstNameKo: profile.firstNameKo,
      lastNameKo: profile.lastNameKo,
      firstNameEn: profile.firstName,
      middleNameEn: profile.middleName ?? "",
      lastNameEn: profile.lastName,
      nationality: profile.nationality,
      dateOfBirth: profile.dateOfBirth,
      email: profile.email
    }
  };

  if (body.role === "STAFF") {
    return [identity];
  }

  const studentBody = body as Extract<AdminAccountCreateBody, { role: "STUDENT" }>;
  const studentProfile = studentBody.profile;

  const address: PersonSectionWrite = {
    personId,
    sectionKey: "student-address.v1",
    payload: {
      termTimeAddress: studentProfile.termTimeAddress,
      homeAddress: studentProfile.homeAddress
    }
  };

  const segmentation: PersonSectionWrite = {
    personId,
    sectionKey: "student-segmentation.v1",
    payload: toStudentSegmentationSectionPayload(studentProfile.segmentation)
  };

  return [identity, address, segmentation];
}

export function buildOptionalPhotoSectionWrite(personId: string, imagePngBase64: string): PersonSectionWrite {
  return {
    personId,
    sectionKey: "photo.v1",
    payload: {
      mimeType: "image/png",
      imageBase64: imagePngBase64
    }
  };
}

/**
 * Extension hook: merge extra person-section writes (e.g. future signup detail tables) without
 * changing the transaction orchestrator. Pass an empty array when nothing to add.
 */
export function mergePersonSectionWrites(
  required: PersonSectionWrite[],
  extensionWrites: PersonSectionWrite[] | undefined
): PersonSectionWrite[] {
  if (!extensionWrites?.length) {
    return required;
  }
  return [...required, ...extensionWrites];
}

export function toUserCreateApiResponseBody(user: UserWithRole, permissions: string[]) {
  return {
    ...sanitizeUserRecord(user),
    permissions
  };
}
