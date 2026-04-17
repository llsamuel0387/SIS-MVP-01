"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  StaffProfileFields,
  StudentProfileFields
} from "@/app/admin/accounts/create/_components/profile-fields";
import { CREATE_ACCOUNT_ROLE_OPTIONS } from "@/app/admin/accounts/create/_config/create-account-options";
import type {
  CreateAccountFormState,
  CreateAccountRole
} from "@/app/admin/accounts/create/_types/create-account";
import type { StudentSegmentationConfig } from "@/lib/student-segmentation";

type CreateAccountFormProps = {
  form: CreateAccountFormState;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRoleChange: (role: CreateAccountRole) => void;
  onFormChange: Dispatch<SetStateAction<CreateAccountFormState>>;
  segmentationConfig: StudentSegmentationConfig | null;
};

export default function CreateAccountForm({
  form,
  pending,
  onSubmit,
  onRoleChange,
  onFormChange,
  segmentationConfig
}: CreateAccountFormProps) {
  return (
    <form className="panel stack" onSubmit={(event) => void onSubmit(event)}>
      <label className="stack">
        <span className="eyebrow">Login ID</span>
        <input
          required
          value={form.loginId}
          onChange={(event) => onFormChange((prev) => ({ ...prev, loginId: event.target.value }))}
        />
      </label>
      <label className="stack">
        <span className="eyebrow">Initial Password</span>
        <input
          required
          type="password"
          minLength={10}
          value={form.password}
          onChange={(event) => onFormChange((prev) => ({ ...prev, password: event.target.value }))}
        />
      </label>
      <label className="stack">
        <span className="eyebrow">Role</span>
        <select value={form.role} onChange={(event) => onRoleChange(event.target.value as CreateAccountRole)}>
          {CREATE_ACCOUNT_ROLE_OPTIONS.map((roleOption) => (
            <option key={roleOption.value} value={roleOption.value}>
              {roleOption.label}
            </option>
          ))}
        </select>
      </label>

      {form.role === "STUDENT" ? (
        <StudentProfileFields
          value={form.studentProfile}
          segmentationConfig={segmentationConfig}
          onChange={(next) => onFormChange((prev) => ({ ...prev, studentProfile: next }))}
        />
      ) : null}
      {form.role === "STAFF" ? (
        <StaffProfileFields
          value={form.staffProfile}
          onChange={(next) => onFormChange((prev) => ({ ...prev, staffProfile: next }))}
        />
      ) : null}

      <button className="button" type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}
