import { prisma } from "@/lib/prisma";
import type { RoleCode } from "@/lib/permissions";
import { STAFF_TIER_PERMISSION_GRANTS } from "@/lib/permissions";
import { getRolePermissions, sanitizeUserRecord } from "@/lib/user-admin";

export type UsersPickerRow = ReturnType<typeof sanitizeUserRecord> & {
  staffTier: string | null;
  permissions: string[];
};

export async function listUsersForPicker(roles: RoleCode[]): Promise<UsersPickerRow[]> {
  const users = await prisma.user.findMany({
    where: { role: { code: { in: roles } } },
    include: { role: true, staff: true },
    orderBy: { createdAt: "desc" }
  });

  return Promise.all(
    users.map(async (user) => {
      const rolePermissions = await getRolePermissions(user.roleId);
      const tierPermissions = user.staff?.staffTier ? STAFF_TIER_PERMISSION_GRANTS[user.staff.staffTier] : [];
      return {
        ...sanitizeUserRecord(user),
        staffTier: user.staff?.staffTier ?? null,
        permissions: Array.from(new Set([...rolePermissions, ...tierPermissions]))
      };
    })
  );
}
