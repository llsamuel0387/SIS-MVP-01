import type { PaginatedResponse } from "@/lib/pagination";
import { secureFetchJson } from "@/lib/parse-fetch-response-json";
import type { StaffTierCode } from "@/lib/permissions";

export type AccountRoleFilter = "ALL" | "STUDENT" | "STAFF" | "ADMIN";
export const ACCOUNT_LIST_PAGE_SIZE = 25;

export type AccountRow = {
  id: string;
  name: string;
  loginId: string;
  role: "STUDENT" | "STAFF" | "ADMIN";
  status: string;
  enrollmentStatus?: "ENROLLED" | "NOT_ENROLLED" | null;
  staffTier?: StaffTierCode | null;
};

export type AccountSuggestion = {
  id: string;
  name: string;
  loginId: string;
  role: "STUDENT" | "STAFF" | "ADMIN";
};

export type CreateAdminAccountPayload = {
  loginId: string;
  password: string;
  role: "STUDENT" | "STAFF" | "ADMIN";
  profile?: unknown;
};

function buildAccountQuery(
  roleFilter: AccountRoleFilter,
  query?: string,
  suggest?: boolean,
  pagination?: { page?: number; pageSize?: number }
): string {
  const roleParam = roleFilter === "ALL" ? "" : `role=${roleFilter}`;
  const queryParam = query ? `${roleParam ? "&" : ""}q=${encodeURIComponent(query)}` : "";
  const suggestParam = suggest ? `${roleParam || queryParam ? "&" : ""}suggest=1` : "";
  const pageParam = !suggest && pagination?.page ? `${roleParam || queryParam || suggestParam ? "&" : ""}page=${pagination.page}` : "";
  const pageSizeParam =
    !suggest && pagination?.pageSize
      ? `${roleParam || queryParam || suggestParam || pageParam ? "&" : ""}pageSize=${pagination.pageSize}`
      : "";
  const qs = [roleParam, queryParam, suggestParam, pageParam, pageSizeParam].filter(Boolean).join("");
  return qs ? `?${qs}` : "";
}

export async function listAccounts(
  roleFilter: AccountRoleFilter,
  query?: string,
  pagination?: { page?: number; pageSize?: number }
): Promise<{ ok: boolean; data: PaginatedResponse<AccountRow> }> {
  return await secureFetchJson<PaginatedResponse<AccountRow>>(`/api/admin/accounts${buildAccountQuery(roleFilter, query, false, pagination)}`);
}

export async function suggestAccounts(
  roleFilter: AccountRoleFilter,
  query: string
): Promise<{ ok: boolean; data: AccountSuggestion[] }> {
  return await secureFetchJson<AccountSuggestion[]>(`/api/admin/accounts${buildAccountQuery(roleFilter, query, true)}`);
}

export async function getAccountDetail<T>(userId: string): Promise<{ ok: boolean; data: T }> {
  return await secureFetchJson<T>(`/api/admin/accounts/${userId}`);
}

export async function createAdminAccount(payload: CreateAdminAccountPayload): Promise<{ ok: boolean; data: unknown }> {
  return await secureFetchJson("/api/admin/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateAccountStatus(
  userId: string,
  status: "ACTIVE" | "INACTIVE"
): Promise<{ ok: boolean; data: unknown }> {
  return await secureFetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

export async function updateAccountStaffTier(
  userId: string,
  staffTier: StaffTierCode
): Promise<{ ok: boolean; data: unknown }> {
  return await secureFetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffTier })
  });
}

export async function updateStudentEnrollmentStatus(
  userId: string,
  enrollmentStatus: "ENROLLED" | "NOT_ENROLLED"
): Promise<{ ok: boolean; data: unknown }> {
  return await secureFetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enrollmentStatus })
  });
}

export async function updateStudentSegmentation(
  userId: string,
  segmentation: { department?: string; pathway?: string }
): Promise<{ ok: boolean; data: unknown }> {
  return await secureFetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segmentation })
  });
}

export type AccountProfileUpdatePayload = {
  photoPngBase64?: string;
  removePhoto?: boolean;
  firstNameKo: string;
  lastNameKo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
  termTimeAddress?: {
    country: string;
    addressLine1: string;
    addressLine2?: string;
    postCode: string;
  };
  homeAddress?: {
    country: string;
    addressLine1: string;
    addressLine2?: string;
    postCode: string;
  };
};

export async function updateAccountProfile(
  userId: string,
  profile: AccountProfileUpdatePayload
): Promise<{ ok: boolean; data: unknown }> {
  return await secureFetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile })
  });
}

export async function deleteAccountById(userId: string): Promise<{ ok: boolean; data: unknown }> {
  return await secureFetchJson(`/api/admin/accounts/${userId}`, {
    method: "DELETE"
  });
}

export async function resetAccountPassword(
  targetUserId: string,
  newPassword: string,
  currentPassword?: string
): Promise<{ ok: boolean; data: unknown }> {
  const body: Record<string, string> = { targetUserId, newPassword };
  if (currentPassword) {
    body.currentPassword = currentPassword;
  }
  return await secureFetchJson("/api/auth/password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
