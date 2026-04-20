import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import { hasPermission, type SessionUser } from "@/lib/authz";
import { PERMISSIONS, ROLES } from "@/lib/permissions";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type PatchStudentEnrollmentStatusInput = {
  actor: SessionUser;
  studentId: string;
  newStatus: "ENROLLED" | "LEAVE_OF_ABSENCE" | "WITHDRAWN" | "GRADUATED";
  reason: string;
};

export async function patchStudentEnrollmentStatus(input: PatchStudentEnrollmentStatusInput) {
  const canUpdate =
    (input.actor.role === ROLES.staff && hasPermission(input.actor, PERMISSIONS.studentStatusUpdateAssigned)) ||
    (input.actor.role === ROLES.admin && hasPermission(input.actor, PERMISSIONS.studentUpdateAll));

  if (!canUpdate) {
    return { ok: false as const, code: ERROR_CODES.AUTH_FORBIDDEN as ErrorCode };
  }

  const target = await prisma.student.findUnique({
    where: { id: input.studentId },
    include: { user: { select: { loginId: true } } }
  });
  if (!target) {
    return { ok: false as const, code: ERROR_CODES.RESOURCE_STUDENT_NOT_FOUND as ErrorCode };
  }

  const oldStatus = target.enrollmentStatus;

  await prisma.$transaction([
    prisma.student.update({
      where: { id: input.studentId },
      data: { enrollmentStatus: input.newStatus }
    }),
    prisma.studentStatusHistory.create({
      data: {
        studentId: input.studentId,
        oldStatus,
        newStatus: input.newStatus,
        reason: input.reason,
        changedByUserId: input.actor.id
      }
    })
  ]);

  return {
    ok: true as const,
    body: {
      studentId: input.studentId,
      targetLoginId: target.user.loginId,
      oldStatus,
      newStatus: input.newStatus
    }
  };
}
