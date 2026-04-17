import type { Prisma } from "@prisma/client";
import { readIdentityFromPersonSections } from "@/lib/person-profile";
import { decryptNullableSensitiveField, isEmailLookupIndex } from "@/lib/pii-field";

export type StudentProfileForApiRecord = Prisma.StudentGetPayload<{
  include: {
    user: {
      include: { profile: true; person: { include: { sections: true } } };
    };
  };
}>;

export function toStudentProfileForApiJson(student: StudentProfileForApiRecord) {
  const identity = readIdentityFromPersonSections(student.user.person?.sections);

  return {
    id: student.id,
    studentNo: student.studentNo,
    gradeLevel: student.gradeLevel,
    homeroom: student.homeroom,
    enrollmentStatus: student.enrollmentStatus,
    profile: {
      firstNameKo: decryptNullableSensitiveField(student.user.profile?.firstNameKo) || null,
      lastNameKo: decryptNullableSensitiveField(student.user.profile?.lastNameKo) || null,
      email:
        identity.email ||
        (isEmailLookupIndex(student.user.profile?.email) ? null : decryptNullableSensitiveField(student.user.profile?.email))
    }
  };
}
