import type { AccountRoleFilter } from "@/lib/admin-accounts-client";

export const ACCOUNT_ROLE_FILTER_OPTIONS: Array<{ id: AccountRoleFilter; label: string; heading: string }> = [
  { id: "ALL", label: "All", heading: "ALL" },
  { id: "STUDENT", label: "Students", heading: "STUDENT" },
  { id: "STAFF", label: "Staff", heading: "Staff" },
  { id: "ADMIN", label: "Admins", heading: "ADMIN" }
];
