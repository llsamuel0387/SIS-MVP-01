import type { SessionUser } from "@/lib/authz";
import { hasPermission } from "@/lib/authz";
import { ERROR_CODES } from "@/lib/api-error";
import { createPaginatedResponse, type PaginatedResponse, type PaginationInput } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { getDisplayNameFromProfile, getDisplayNameFromUser } from "@/lib/user-admin";
import {
  buildStaffMemberProfileBlock,
  buildStaffViewStudentProfileBlock,
  extractPhotoDataUrlFromPersonSections
} from "@/lib/user-profile-read-dto";

type StaffStudentDirectoryRow = {
  id: string;
  name: string;
  studentNo: string;
  department: string;
  pathway: string;
  status: string;
};

function toStaffStudentDirectoryRow(student: {
  id: string;
  studentNo: string;
  enrollmentStatus: string;
  segmentationDepartment: string | null;
  segmentationPathway: string | null;
  user: {
    loginId: string;
    profile: Parameters<typeof getDisplayNameFromProfile>[0];
  };
}): StaffStudentDirectoryRow {
  return {
    id: student.id,
    name: getDisplayNameFromProfile(student.user.profile) || student.user.loginId,
    studentNo: student.studentNo,
    department: student.segmentationDepartment ?? "",
    pathway: student.segmentationPathway ?? "",
    status: student.enrollmentStatus
  };
}

export async function listStaffStudentsDirectory(
  user: SessionUser,
  pagination: PaginationInput
): Promise<
  | { ok: true; rows: PaginatedResponse<StaffStudentDirectoryRow> }
  | { ok: false; code: (typeof ERROR_CODES)[keyof typeof ERROR_CODES] }
> {
  if (hasPermission(user, PERMISSIONS.studentViewAll)) {
    const total = await prisma.student.count();
    const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
    const currentPage = Math.min(pagination.page, totalPages);
    const students = await prisma.student.findMany({
      select: {
        id: true,
        studentNo: true,
        enrollmentStatus: true,
        segmentationDepartment: true,
        segmentationPathway: true,
        user: {
          select: {
            loginId: true,
            profile: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pagination.pageSize,
      take: pagination.pageSize
    });

    return {
      ok: true as const,
      rows: createPaginatedResponse(students.map(toStaffStudentDirectoryRow), total, currentPage, pagination.pageSize)
    };
  }

  const staff = await prisma.staff.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!staff) {
    return { ok: false as const, code: ERROR_CODES.RESOURCE_STAFF_NOT_FOUND };
  }

  const total = await prisma.studentAssignment.count({
    where: { staffId: staff.id }
  });
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const currentPage = Math.min(pagination.page, totalPages);
  const assignments = await prisma.studentAssignment.findMany({
    where: { staffId: staff.id },
    select: {
      student: {
        select: {
          id: true,
          studentNo: true,
          enrollmentStatus: true,
          segmentationDepartment: true,
          segmentationPathway: true,
          user: {
            select: {
              loginId: true,
              profile: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pagination.pageSize,
    take: pagination.pageSize
  });

  return {
    ok: true as const,
    rows: createPaginatedResponse(
      assignments.map((assignment) => toStaffStudentDirectoryRow(assignment.student)),
      total,
      currentPage,
      pagination.pageSize
    )
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
      studentNo: student.studentNo,
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
      staffNo: staff.employeeNo,
      roleLabel: staff.staffTier,
      status: staff.employmentStatus,
      photoDataUrl,
      profile: buildStaffMemberProfileBlock(staff.user.profile, sections, { department: staff.department })
    }
  };
}
