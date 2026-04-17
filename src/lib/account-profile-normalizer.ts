import type { StaffProfileDraft, StudentProfileDraft } from "@/app/admin/accounts/create/_components/profile-fields";

function normalizeOptionalText(value: string): string | undefined {
  const clean = value.trim();
  return clean.length > 0 ? clean : undefined;
}

export function normalizeStudentProfile(profile: StudentProfileDraft) {
  return {
    ...profile,
    photoPngBase64: normalizeOptionalText(profile.photoPngBase64),
    firstNameKo: profile.firstNameKo.trim(),
    lastNameKo: profile.lastNameKo.trim(),
    firstName: profile.firstName.trim(),
    middleName: normalizeOptionalText(profile.middleName),
    lastName: profile.lastName.trim(),
    segmentation: {
      department: normalizeOptionalText(profile.segmentation.department),
      pathway: normalizeOptionalText(profile.segmentation.pathway),
      classes: profile.segmentation.classes
        .map((value) => normalizeOptionalText(value))
        .filter((value): value is string => Boolean(value))
    }
  };
}

export function normalizeStaffProfile(profile: StaffProfileDraft) {
  return {
    ...profile,
    photoPngBase64: normalizeOptionalText(profile.photoPngBase64),
    firstNameKo: profile.firstNameKo.trim(),
    lastNameKo: profile.lastNameKo.trim(),
    firstName: profile.firstName.trim(),
    middleName: normalizeOptionalText(profile.middleName),
    lastName: profile.lastName.trim()
  };
}
