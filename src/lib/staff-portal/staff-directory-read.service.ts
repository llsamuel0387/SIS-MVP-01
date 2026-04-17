import type { SessionUser } from "@/lib/authz";
import { hasPermission } from "@/lib/authz";
import { ERROR_CODES } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { getDisplayNameFromUser } from "@/lib/user-admin";
import {
  buildStaffMemberProfileBlock,
  buildStaffViewStudentProfileBlock,
  extractPhotoDataUrlFromPersonSections,
  readSegmentationModelFromPersonSections
} from "@/lib/user-profile-read-dto";

export async function listStaffStudentsDirectory(user: SessionUser) {
  if (hasPermission(user, PERMISSIONS.studentViewAll)) {
    const students = await prisma.student.findMany({
      include: {
        user: {
          include: {
            profile: true,
            person: { include: { sections: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      ok: true as const,
      rows: students.map((student) => {
        const sections = student.user.person?.sections;
        const segmentation = readSegmentationModelFromPersonSections(sections);
        return {
          id: student.id,
          name: getDisplayNameFromUser(student.user.profile, student.user.person) || student.user.loginId,
          studentNo: "",
          department: segmentation.values.department,
          pathway: segmentation.values.pathway,
          status: student.enrollmentStatus
        };
      })
    };
  }

  const staff = await prisma.staff.findUnique({
    where: { userId: user.id },
    include: {
      assignments: {
        include: {
          student: {
            include: {
              user: {
                include: {
                  profile: true,
                  person: { include: { sections: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!staff) {
    return { ok: false as const, code: ERROR_CODES.RESOURCE_STAFF_NOT_FOUND };
  }

  return {
    ok: true as const,
    rows: staff.assignments.map((assignment) => {
      const sections = assignment.student.user.person?.sections;
      const segmentation = readSegmentationModelFromPersonSections(sections);
      return {
        id: assignment.student.id,
        name: getDisplayNameFromUser(assignment.student.user.profile, assignment.student.user.person) || assignment.student.user.loginId,
        studentNo: "",
        department: segmentation.values.department,
        pathway: segmentation.values.pathway,
        status: assignment.student.enrollmentStatus
      };
    })
  };
}

export async function getStaffStudentDetailJson(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        include: { profile: true, person: { include: { sections: true } } }
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
      name: getDisplayNameFromUser(student.user.profile, student.user.person) || student.user.loginId,
      studentNo: "",
      status: student.enrollmentStatus,
      photoDataUrl,
      profile: buildStaffViewStudentProfileBlock(student.user.profile, sections)
    }
  };
}

export async function getStaffMemberCardJson(staffId: string) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      user: {
        include: { profile: true, person: { include: { sections: true } } }
      }
    }
  });

  if (!staff) {
    return { ok: false as const, code: ERROR_CODES.RESOURCE_STAFF_NOT_FOUND };
  }

  const sections = staff.user.person?.sections;
  const photoDataUrl = extractPhotoDataUrlFromPersonSections(sections);

  return {
    ok: true as const,
    json: {
      id: staff.id,
      name: getDisplayNameFromUser(staff.user.profile, staff.user.person) || staff.user.loginId,
      staffNo: "",
      roleLabel: staff.staffTier,
      status: staff.employmentStatus,
      photoDataUrl,
      profile: buildStaffMemberProfileBlock(staff.user.profile, sections, { department: staff.department })
    }
  };
}
