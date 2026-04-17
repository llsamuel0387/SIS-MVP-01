import type { CreateAccountRole } from "@/app/admin/accounts/create/_types/create-account";

export const CREATE_ACCOUNT_ROLE_OPTIONS: ReadonlyArray<{ value: CreateAccountRole; label: string }> = [
  { value: "STUDENT", label: "STUDENT" },
  { value: "STAFF", label: "STAFF" },
  { value: "ADMIN", label: "ADMIN" }
];

export function formatCreateAccountRoleLabel(role: CreateAccountRole): string {
  return CREATE_ACCOUNT_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}
