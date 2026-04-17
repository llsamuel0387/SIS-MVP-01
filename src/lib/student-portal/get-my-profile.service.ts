import { ERROR_CODES } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { extractPhotoDataUrlFromPersonSections, buildStudentPortalProfileNested } from "@/lib/user-profile-read-dto";

export async function getStudentMyProfileJson(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId: userId },
    include: {
      user: {
        include: {
          profile: true,
          person: { include: { sections: true } }
        }
      }
    }
  });

  if (!student) {
    return { ok: false as const, code: ERROR_CODES.RESOURCE_STUDENT_NOT_FOUND };
  }

  const sections = student.user.person?.sections;
  const photoDataUrl = extractPhotoDataUrlFromPersonSections(sections);

  return {
    ok: true as const,
    json: {
      id: student.id,
      studentNo: student.studentNo,
      gradeLevel: student.gradeLevel,
      homeroom: student.homeroom,
      enrollmentStatus: student.enrollmentStatus,
      photoDataUrl,
      profile: buildStudentPortalProfileNested(student.user.profile, sections)
    }
  };
}
