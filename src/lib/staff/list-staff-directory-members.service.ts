import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import type { SessionUser } from "@/lib/authz";
import { createPaginatedResponse, type PaginatedResponse, type PaginationInput } from "@/lib/pagination";
import { getDisplayNameFromProfile } from "@/lib/user-admin";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

function toStaffMemberJson(member: {
  id: string;
  employeeNo: string;
  staffTier: string;
  department: string | null;
  employmentStatus: string;
  user: { loginId: string; profile: Parameters<typeof getDisplayNameFromProfile>[0] };
}) {
  return {
    id: member.id,
    staffNo: member.employeeNo,
    staffTier: member.staffTier,
    department: member.department,
    pathway: "",
    status: member.employmentStatus,
    name: getDisplayNameFromProfile(member.user.profile) || member.user.loginId
  };
}

export async function listStaffDirectoryMembers(
  actor: SessionUser,
  pagination: PaginationInput
): Promise<{ ok: true; body: PaginatedResponse<ReturnType<typeof toStaffMemberJson>> } | { ok: false; code: ErrorCode }> {
  if (hasPermission(actor, PERMISSIONS.staffViewAll)) {
    const total = await prisma.staff.count();
    const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
    const currentPage = Math.min(pagination.page, totalPages);
    const staffMembers = await prisma.staff.findMany({
      select: {
        id: true,
        employeeNo: true,
        staffTier: true,
        department: true,
        employmentStatus: true,
        user: { select: { loginId: true, profile: true } }
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pagination.pageSize,
      take: pagination.pageSize
    });
    return {
      ok: true as const,
      body: createPaginatedResponse(staffMembers.map(toStaffMemberJson), total, currentPage, pagination.pageSize)
    };
  }

  if (!hasPermission(actor, PERMISSIONS.staffViewSelf) || !actor.staffId) {
    return { ok: false as const, code: ERROR_CODES.AUTH_FORBIDDEN as ErrorCode };
  }

  const selfStaff = await prisma.staff.findUnique({
    where: { id: actor.staffId },
    select: {
      id: true,
      employeeNo: true,
      staffTier: true,
      department: true,
      employmentStatus: true,
      user: { select: { loginId: true, profile: true } }
    }
  });
  if (!selfStaff) {
    return { ok: false as const, code: ERROR_CODES.RESOURCE_STAFF_NOT_FOUND as ErrorCode };
  }

  return {
    ok: true as const,
    body: createPaginatedResponse([toStaffMemberJson(selfStaff)], 1, 1, pagination.pageSize)
  };
}
