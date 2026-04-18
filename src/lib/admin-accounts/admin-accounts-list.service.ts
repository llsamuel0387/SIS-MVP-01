import type { Prisma } from "@prisma/client";
import { normalizeAccountSearchQuery } from "@/lib/account-search-text";
import { createPaginatedResponse, type PaginatedResponse } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type { RoleCode, StaffTierCode } from "@/lib/permissions";
import { STAFF_TIER_PERMISSION_GRANTS } from "@/lib/permissions";
import { getDisplayNameFromProfile } from "@/lib/user-admin";

export type AdminAccountsListParams = {
  roles: RoleCode[];
  query: string;
  suggestMode: boolean;
  page: number;
  pageSize: number;
};

export type AdminAccountSuggestion = { id: string; name: string; loginId: string; role: string };

export type AdminAccountListRow = {
  id: string;
  loginId: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  name: string;
  staffTier: string | null;
  enrollmentStatus: "ENROLLED" | "NOT_ENROLLED" | null;
  permissions: string[];
};

function buildAdminAccountsWhere(roles: RoleCode[], query: string): Prisma.UserWhereInput {
  const searchQuery = normalizeAccountSearchQuery(query);
  return {
    role: { code: { in: roles } },
    ...(searchQuery ? { accountSearchText: { contains: searchQuery } } : {})
  };
}

function buildAdminAccountRow(user: {
  id: string;
  loginId: string;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  role: { code: string; rolePermissions: Array<{ permission: { code: string } }> };
  profile: Parameters<typeof getDisplayNameFromProfile>[0];
  staff: { staffTier: string } | null;
  student: { enrollmentStatus: string } | null;
}): AdminAccountListRow {
  const rolePermissions = user.role.rolePermissions.map((row) => row.permission.code);
  const tierPermissions = user.staff?.staffTier
    ? STAFF_TIER_PERMISSION_GRANTS[user.staff.staffTier as StaffTierCode]
    : [];

  return {
    id: user.id,
    loginId: user.loginId,
    role: user.role.code,
    status: user.status,
    name: getDisplayNameFromProfile(user.profile) || user.loginId || "-",
    staffTier: user.staff?.staffTier ?? null,
    enrollmentStatus: user.student ? (user.student.enrollmentStatus === "ENROLLED" ? "ENROLLED" : "NOT_ENROLLED") : null,
    permissions: Array.from(new Set([...rolePermissions, ...tierPermissions]))
  };
}

export async function listAdminAccountsForApi(
  params: AdminAccountsListParams
): Promise<AdminAccountSuggestion[] | PaginatedResponse<AdminAccountListRow>> {
  const { roles, query, suggestMode, page, pageSize } = params;
  const where = buildAdminAccountsWhere(roles, query);

  if (suggestMode) {
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        loginId: true,
        role: { select: { code: true } },
        profile: true
      },
      orderBy: { createdAt: "desc" },
      take: 8
    });
    return users.map((user) => ({
      id: user.id,
      name: getDisplayNameFromProfile(user.profile) || user.loginId || "-",
      loginId: user.loginId,
      role: user.role.code
    }));
  }

  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      loginId: true,
      status: true,
      role: {
        select: {
          code: true,
          rolePermissions: {
            select: {
              permission: { select: { code: true } }
            }
          }
        }
      },
      profile: true,
      staff: { select: { staffTier: true } },
      student: { select: { enrollmentStatus: true } }
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize
  });

  return createPaginatedResponse(users.map(buildAdminAccountRow), total, currentPage, pageSize);
}
