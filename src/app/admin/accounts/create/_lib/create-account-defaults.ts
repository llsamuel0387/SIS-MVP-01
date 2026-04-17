import type { StaffProfileDraft, StudentProfileDraft } from "@/app/admin/accounts/create/_components/profile-fields";
import { createEmptyStudentSegmentation } from "@/lib/student-segmentation";
import { STAFF_TIERS } from "@/lib/permissions";

const EMPTY_ADDRESS = { country: "", addressLine1: "", addressLine2: "", postCode: "" };

export function createEmptyStudentProfile(): StudentProfileDraft {
  return {
    photoPngBase64: "",
    firstNameKo: "",
    lastNameKo: "",
    firstName: "",
    middleName: "",
    lastName: "",
    nationality: "",
    dateOfBirth: "",
    email: "",
    termTimeAddress: { ...EMPTY_ADDRESS },
    homeAddress: { ...EMPTY_ADDRESS },
    segmentation: createEmptyStudentSegmentation()
  };
}

export function createEmptyStaffProfile(): StaffProfileDraft {
  return {
    photoPngBase64: "",
    firstNameKo: "",
    lastNameKo: "",
    firstName: "",
    middleName: "",
    lastName: "",
    nationality: "",
    dateOfBirth: "",
    email: "",
    staffTier: STAFF_TIERS.staff
  };
}
