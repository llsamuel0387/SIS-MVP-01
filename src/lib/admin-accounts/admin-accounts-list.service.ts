import { prisma } from "@/lib/prisma";
import type { RoleCode } from "@/lib/permissions";
import { STAFF_TIER_PERMISSION_GRANTS } from "@/lib/permissions";
import { getDisplayNameFromUser, getRolePermissions, sanitizeUserRecord } from "@/lib/user-admin";

export type AdminAccountsListParams = {
  roles: RoleCode[];
  query: string;
  suggestMode: boolean;
};

export type AdminAccountSuggestion = { id: string; name: string; loginId: string; role: string };

export type AdminAccountListRow = ReturnType<typeof sanitizeUserRecord> & {
  name: string;
  staffTier: string | null;
  enrollmentStatus: "ENROLLED" | "NOT_ENROLLED" | null;
  permissions: string[];
};

export async function listAdminAccountsForApi(params: AdminAccountsListParams): Promise<AdminAccountSuggestion[] | AdminAccountListRow[]> {
  const { roles, query, suggestMode } = params;
  const queryLower = query.toLowerCase();

  // Temporary: loginId + decrypted display name substring match requires loading role-scoped rows and
  // filtering in process (PII ciphertext is not DB-searchable). Long-term: denormalized search index
  // column (normalized lowercase, non-secret) maintained on profile/person updates; Prisma where on that.

  const users = await prisma.user.findMany({
    where: { role: { code: { in: roles } } },
    include: { role: true, profile: true, staff: true, student: true, person: { include: { sections: true } } },
    orderBy: { createdAt: "desc" }
  });

  const filteredUsers = query
    ? users.filter((user) => {
        const displayName = (getDisplayNameFromUser(user.profile, user.person) || "").toLowerCase();
        return user.loginId.toLowerCase().includes(queryLower) || displayName.includes(queryLower);
      })
    : users;

  if (suggestMode) {
    return filteredUsers.slice(0, 8).map((user) => ({
      id: user.id,
      name: getDisplayNameFromUser(user.profile, user.person) || "-",
      loginId: user.loginId,
      role: user.role.code
    }));
  }

  const enriched: AdminAccountListRow[] = await Promise.all(
    filteredUsers.map(async (user) => {
      const rolePermissions = await getRolePermissions(user.roleId);
      const tierPermissions = user.staff?.staffTier ? STAFF_TIER_PERMISSION_GRANTS[user.staff.staffTier] : [];
      return {
        ...sanitizeUserRecord(user),
        name: getDisplayNameFromUser(user.profile, user.person) || "-",
        staffTier: user.staff?.staffTier ?? null,
        enrollmentStatus: user.student ? (user.student.enrollmentStatus === "ENROLLED" ? "ENROLLED" : "NOT_ENROLLED") : null,
        permissions: Array.from(new Set([...rolePermissions, ...tierPermissions]))
      };
    })
  );

  return enriched;
}
