import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import type { SessionUser } from "@/lib/authz";
import { getDisplayNameFromUser } from "@/lib/user-admin";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

function toStaffMemberJson(member: {
  id: string;
  staffTier: string;
  department: string | null;
  employmentStatus: string;
  user: { loginId: string; profile: Parameters<typeof getDisplayNameFromUser>[0]; person: Parameters<typeof getDisplayNameFromUser>[1] };
}) {
  return {
    id: member.id,
    staffNo: "",
    staffTier: member.staffTier,
    department: member.department,
    pathway: "",
    status: member.employmentStatus,
    name: getDisplayNameFromUser(member.user.profile, member.user.person) || member.user.loginId
  };
}

export async function listStaffDirectoryMembers(actor: SessionUser) {
  if (hasPermission(actor, PERMISSIONS.staffViewAll)) {
    const staffMembers = await prisma.staff.findMany({
      include: {
        user: { include: { profile: true, person: { include: { sections: true } } } }
      },
      orderBy: { createdAt: "desc" }
    });
    return { ok: true as const, body: staffMembers.map(toStaffMemberJson) };
  }

  if (!hasPermission(actor, PERMISSIONS.staffViewSelf) || !actor.staffId) {
    return { ok: false as const, code: ERROR_CODES.AUTH_FORBIDDEN as ErrorCode };
  }

  const selfStaff = await prisma.staff.findUnique({
    where: { id: actor.staffId },
    include: { user: { include: { profile: true, person: { include: { sections: true } } } } }
  });
  if (!selfStaff) {
    return { ok: false as const, code: ERROR_CODES.RESOURCE_STAFF_NOT_FOUND as ErrorCode };
  }

  return { ok: true as const, body: [toStaffMemberJson(selfStaff)] };
}
