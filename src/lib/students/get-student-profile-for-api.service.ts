import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import { toStudentProfileForApiJson } from "@/lib/students/get-student-profile-for-api.helpers";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export async function getStudentProfileForApi(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        include: { profile: true, person: { include: { sections: true } } }
      }
    }
  });

  if (!student) {
    return { ok: false as const, code: ERROR_CODES.RESOURCE_STUDENT_NOT_FOUND as ErrorCode };
  }

  return { ok: true as const, json: toStudentProfileForApiJson(student) };
}
