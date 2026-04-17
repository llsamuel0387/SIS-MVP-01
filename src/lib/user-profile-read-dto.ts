import type { PersonSection, UserProfile } from "@prisma/client";
import { decryptPersonSectionPayload } from "@/lib/person-data";
import { readStudentSegmentationSectionPayload } from "@/lib/student-segmentation";
import { decryptNullableSensitiveField, isEmailLookupIndex } from "@/lib/pii-field";
import { readIdentityFromPersonSections, readStudentAddressFromPersonSections } from "@/lib/person-profile";

export type SegmentationReadModel = ReturnType<typeof readStudentSegmentationSectionPayload>;

/** Shared: decrypt `photo.v1` section → `data:image/png;base64,...` or null. */
export function extractPhotoDataUrlFromPersonSections(sections: PersonSection[] | undefined): string | null {
  if (!sections?.length) {
    return null;
  }
  try {
    const photoSection = sections.find((section) => section.sectionKey === "photo.v1");
    if (!photoSection) {
      return null;
    }
    const payload = decryptPersonSectionPayload(photoSection);
    const mimeType = typeof payload.mimeType === "string" ? payload.mimeType : "";
    const imageBase64 = typeof payload.imageBase64 === "string" ? payload.imageBase64 : "";
    if (mimeType === "image/png" && imageBase64.length > 0) {
      return `data:${mimeType};base64,${imageBase64}`;
    }
    return null;
  } catch {
    return null;
  }
}

/** Shared: read student-segmentation section into labels/values model. */
export function readSegmentationModelFromPersonSections(sections: PersonSection[] | undefined): SegmentationReadModel {
  if (!sections?.length) {
    return readStudentSegmentationSectionPayload(null);
  }
  try {
    const segmentationSection = sections.find((section) => section.sectionKey === "student-segmentation.v1");
    if (!segmentationSection) {
      return readStudentSegmentationSectionPayload(null);
    }
    return readStudentSegmentationSectionPayload(decryptPersonSectionPayload(segmentationSection));
  } catch {
    return readStudentSegmentationSectionPayload(null);
  }
}

/** Admin account detail GET — identity first for Korean + English merge (matches legacy route). */
export function buildAdminAccountUserDetailProfileBlock(profile: UserProfile, sections: PersonSection[] | undefined) {
  const identity = readIdentityFromPersonSections(sections);
  const address = readStudentAddressFromPersonSections(sections);
  const segmentation = readSegmentationModelFromPersonSections(sections);
  return {
    firstNameKo: identity.firstNameKo || decryptNullableSensitiveField(profile.firstNameKo),
    lastNameKo: identity.lastNameKo || decryptNullableSensitiveField(profile.lastNameKo),
    firstNameEn: identity.firstNameEn || decryptNullableSensitiveField(profile.firstNameEn),
    middleNameEn: identity.middleNameEn || decryptNullableSensitiveField(profile.middleNameEn),
    lastNameEn: identity.lastNameEn || decryptNullableSensitiveField(profile.lastNameEn),
    nationality: identity.nationality || decryptNullableSensitiveField(profile.nationality),
    dateOfBirth: identity.dateOfBirth || (profile.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : ""),
    email: identity.email || (isEmailLookupIndex(profile.email) ? "" : decryptNullableSensitiveField(profile.email)),
    termTimeAddress: {
      country: address.termTimeAddress.country || decryptNullableSensitiveField(profile.termCountry),
      addressLine1: address.termTimeAddress.addressLine1 || decryptNullableSensitiveField(profile.termAddressLine1),
      addressLine2: address.termTimeAddress.addressLine2 || decryptNullableSensitiveField(profile.termAddressLine2),
      postCode: address.termTimeAddress.postCode || decryptNullableSensitiveField(profile.termPostCode)
    },
    homeAddress: {
      country: address.homeAddress.country || decryptNullableSensitiveField(profile.homeCountry),
      addressLine1: address.homeAddress.addressLine1 || decryptNullableSensitiveField(profile.homeAddressLine1),
      addressLine2: address.homeAddress.addressLine2 || decryptNullableSensitiveField(profile.homeAddressLine2),
      postCode: address.homeAddress.postCode || decryptNullableSensitiveField(profile.homePostCode)
    },
    segmentation
  };
}

/** Student portal `GET /api/my/profile` — Korean names prefer encrypted profile row (legacy). */
export function buildStudentPortalProfileNested(profile: UserProfile | null | undefined, sections: PersonSection[] | undefined) {
  const identity = readIdentityFromPersonSections(sections);
  const address = readStudentAddressFromPersonSections(sections);
  const segmentation = readSegmentationModelFromPersonSections(sections);
  return {
    firstNameKo: decryptNullableSensitiveField(profile?.firstNameKo) || null,
    lastNameKo: decryptNullableSensitiveField(profile?.lastNameKo) || null,
    firstNameEn: identity.firstNameEn || decryptNullableSensitiveField(profile?.firstNameEn),
    middleNameEn: identity.middleNameEn || decryptNullableSensitiveField(profile?.middleNameEn),
    lastNameEn: identity.lastNameEn || decryptNullableSensitiveField(profile?.lastNameEn),
    nationality: identity.nationality || decryptNullableSensitiveField(profile?.nationality),
    dateOfBirth: identity.dateOfBirth || (profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : ""),
    email:
      identity.email ||
      (isEmailLookupIndex(profile?.email) ? "" : decryptNullableSensitiveField(profile?.email)),
    termTimeAddress: {
      country: address.termTimeAddress.country || decryptNullableSensitiveField(profile?.termCountry),
      addressLine1: address.termTimeAddress.addressLine1 || decryptNullableSensitiveField(profile?.termAddressLine1),
      addressLine2: address.termTimeAddress.addressLine2 || decryptNullableSensitiveField(profile?.termAddressLine2),
      postCode: address.termTimeAddress.postCode || decryptNullableSensitiveField(profile?.termPostCode)
    },
    homeAddress: {
      country: address.homeAddress.country || decryptNullableSensitiveField(profile?.homeCountry),
      addressLine1: address.homeAddress.addressLine1 || decryptNullableSensitiveField(profile?.homeAddressLine1),
      addressLine2: address.homeAddress.addressLine2 || decryptNullableSensitiveField(profile?.homeAddressLine2),
      postCode: address.homeAddress.postCode || decryptNullableSensitiveField(profile?.homePostCode)
    },
    department: segmentation.values.department,
    pathway: segmentation.values.pathway
  };
}

/** Staff view of a student — identity-first merge + flat department/pathway (legacy). */
export function buildStaffViewStudentProfileBlock(profile: UserProfile | null | undefined, sections: PersonSection[] | undefined) {
  const identity = readIdentityFromPersonSections(sections);
  const address = readStudentAddressFromPersonSections(sections);
  const segmentation = readSegmentationModelFromPersonSections(sections);
  return {
    firstNameKo: identity.firstNameKo || decryptNullableSensitiveField(profile?.firstNameKo),
    lastNameKo: identity.lastNameKo || decryptNullableSensitiveField(profile?.lastNameKo),
    firstNameEn: identity.firstNameEn || decryptNullableSensitiveField(profile?.firstNameEn),
    middleNameEn: identity.middleNameEn || decryptNullableSensitiveField(profile?.middleNameEn),
    lastNameEn: identity.lastNameEn || decryptNullableSensitiveField(profile?.lastNameEn),
    nationality: identity.nationality || decryptNullableSensitiveField(profile?.nationality),
    dateOfBirth: identity.dateOfBirth || (profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : ""),
    email:
      identity.email ||
      (isEmailLookupIndex(profile?.email) ? "" : decryptNullableSensitiveField(profile?.email)),
    department: segmentation.values.department,
    pathway: segmentation.values.pathway,
    termTimeAddress: {
      country: address.termTimeAddress.country || decryptNullableSensitiveField(profile?.termCountry),
      addressLine1: address.termTimeAddress.addressLine1 || decryptNullableSensitiveField(profile?.termAddressLine1),
      addressLine2: address.termTimeAddress.addressLine2 || decryptNullableSensitiveField(profile?.termAddressLine2),
      postCode: address.termTimeAddress.postCode || decryptNullableSensitiveField(profile?.termPostCode)
    },
    homeAddress: {
      country: address.homeAddress.country || decryptNullableSensitiveField(profile?.homeCountry),
      addressLine1: address.homeAddress.addressLine1 || decryptNullableSensitiveField(profile?.homeAddressLine1),
      addressLine2: address.homeAddress.addressLine2 || decryptNullableSensitiveField(profile?.homeAddressLine2),
      postCode: address.homeAddress.postCode || decryptNullableSensitiveField(profile?.homePostCode)
    }
  };
}

/** Staff card view — staff row supplies department label; pathway stays empty (legacy). */
export function buildStaffMemberProfileBlock(
  profile: UserProfile | null | undefined,
  sections: PersonSection[] | undefined,
  staff: { department: string | null }
) {
  const identity = readIdentityFromPersonSections(sections);
  const address = readStudentAddressFromPersonSections(sections);
  return {
    firstNameKo: identity.firstNameKo || decryptNullableSensitiveField(profile?.firstNameKo),
    lastNameKo: identity.lastNameKo || decryptNullableSensitiveField(profile?.lastNameKo),
    firstNameEn: identity.firstNameEn || decryptNullableSensitiveField(profile?.firstNameEn),
    middleNameEn: identity.middleNameEn || decryptNullableSensitiveField(profile?.middleNameEn),
    lastNameEn: identity.lastNameEn || decryptNullableSensitiveField(profile?.lastNameEn),
    nationality: identity.nationality || decryptNullableSensitiveField(profile?.nationality),
    dateOfBirth: identity.dateOfBirth || (profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : ""),
    email: identity.email || (isEmailLookupIndex(profile?.email) ? "" : decryptNullableSensitiveField(profile?.email)),
    department: staff.department ?? "",
    pathway: "",
    termTimeAddress: {
      country: address.termTimeAddress.country || decryptNullableSensitiveField(profile?.termCountry),
      addressLine1: address.termTimeAddress.addressLine1 || decryptNullableSensitiveField(profile?.termAddressLine1),
      addressLine2: address.termTimeAddress.addressLine2 || decryptNullableSensitiveField(profile?.termAddressLine2),
      postCode: address.termTimeAddress.postCode || decryptNullableSensitiveField(profile?.termPostCode)
    },
    homeAddress: {
      country: address.homeAddress.country || decryptNullableSensitiveField(profile?.homeCountry),
      addressLine1: address.homeAddress.addressLine1 || decryptNullableSensitiveField(profile?.homeAddressLine1),
      addressLine2: address.homeAddress.addressLine2 || decryptNullableSensitiveField(profile?.homeAddressLine2),
      postCode: address.homeAddress.postCode || decryptNullableSensitiveField(profile?.homePostCode)
    }
  };
}
