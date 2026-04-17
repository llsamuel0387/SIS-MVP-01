import { secureClientFetch } from "@/lib/browser-security";
import type { StaffTierCode } from "@/lib/permissions";

export type AccountRoleFilter = "ALL" | "STUDENT" | "STAFF" | "ADMIN";

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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T }> {
  const response = await secureClientFetch(url, init);
  const data = (await response.json()) as T;
  return { ok: response.ok, data };
}

function buildAccountQuery(roleFilter: AccountRoleFilter, query?: string, suggest?: boolean): string {
  const roleParam = roleFilter === "ALL" ? "" : `role=${roleFilter}`;
  const queryParam = query ? `${roleParam ? "&" : ""}q=${encodeURIComponent(query)}` : "";
  const suggestParam = suggest ? `${roleParam || queryParam ? "&" : ""}suggest=1` : "";
  const qs = [roleParam, queryParam, suggestParam].filter(Boolean).join("");
  return qs ? `?${qs}` : "";
}

export async function listAccounts(roleFilter: AccountRoleFilter, query?: string): Promise<{ ok: boolean; data: AccountRow[] }> {
  return await fetchJson<AccountRow[]>(`/api/admin/accounts${buildAccountQuery(roleFilter, query)}`);
}

export async function suggestAccounts(
  roleFilter: AccountRoleFilter,
  query: string
): Promise<{ ok: boolean; data: AccountSuggestion[] }> {
  return await fetchJson<AccountSuggestion[]>(`/api/admin/accounts${buildAccountQuery(roleFilter, query, true)}`);
}

export async function getAccountDetail<T>(userId: string): Promise<{ ok: boolean; data: T }> {
  return await fetchJson<T>(`/api/admin/accounts/${userId}`);
}

export async function createAdminAccount(payload: CreateAdminAccountPayload): Promise<{ ok: boolean; data: unknown }> {
  return await fetchJson("/api/admin/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateAccountStatus(
  userId: string,
  status: "ACTIVE" | "INACTIVE"
): Promise<{ ok: boolean; data: unknown }> {
  return await fetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

export async function updateAccountStaffTier(
  userId: string,
  staffTier: StaffTierCode
): Promise<{ ok: boolean; data: unknown }> {
  return await fetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffTier })
  });
}

export async function updateStudentEnrollmentStatus(
  userId: string,
  enrollmentStatus: "ENROLLED" | "NOT_ENROLLED"
): Promise<{ ok: boolean; data: unknown }> {
  return await fetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enrollmentStatus })
  });
}

export async function updateStudentSegmentation(
  userId: string,
  segmentation: { department?: string; pathway?: string }
): Promise<{ ok: boolean; data: unknown }> {
  return await fetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segmentation })
  });
}

export type AccountProfileUpdatePayload = {
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
  return await fetchJson(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile })
  });
}

export async function deleteAccountById(userId: string): Promise<{ ok: boolean; data: unknown }> {
  return await fetchJson(`/api/admin/accounts/${userId}`, {
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
  return await fetchJson("/api/auth/password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
