import type { StaffProfileDraft, StudentProfileDraft } from "@/app/admin/accounts/create/_components/profile-fields";

export type CreateAccountRole = "STUDENT" | "STAFF" | "ADMIN";

export type CreateAccountFormState = {
  loginId: string;
  password: string;
  role: CreateAccountRole;
  studentProfile: StudentProfileDraft;
  staffProfile: StaffProfileDraft;
};

export type CreateAccountResponse = {
  id: string;
  loginId: string;
  role: CreateAccountRole;
  status: string;
  permissions: string[];
};
