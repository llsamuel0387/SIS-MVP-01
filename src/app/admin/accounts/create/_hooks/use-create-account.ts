"use client";

import { useState, type FormEvent } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import { normalizeStaffProfile, normalizeStudentProfile } from "@/lib/account-profile-normalizer";
import { createAdminAccount } from "@/lib/admin-accounts-client";
import {
  createEmptyStaffProfile,
  createEmptyStudentProfile
} from "@/app/admin/accounts/create/_lib/create-account-defaults";
import type {
  CreateAccountFormState,
  CreateAccountResponse,
  CreateAccountRole
} from "@/app/admin/accounts/create/_types/create-account";

function createInitialForm(): CreateAccountFormState {
  return {
    loginId: "",
    password: "",
    role: "STUDENT",
    studentProfile: createEmptyStudentProfile(),
    staffProfile: createEmptyStaffProfile()
  };
}

export function useCreateAccount() {
  const [form, setForm] = useState<CreateAccountFormState>(() => createInitialForm());
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState<CreateAccountResponse | null>(null);
  const [pending, setPending] = useState(false);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setCreated(null);

    const { ok, data } = await createAdminAccount({
        loginId: form.loginId,
        password: form.password,
        role: form.role,
        ...(form.role === "STUDENT" ? { profile: normalizeStudentProfile(form.studentProfile) } : {}),
        ...(form.role === "STAFF" ? { profile: normalizeStaffProfile(form.staffProfile) } : {})
    });
    setPending(false);

    if (!ok) {
      setMessage(getUiErrorMessage(data, "Failed to create account"));
      return;
    }

    setCreated(data as CreateAccountResponse);
    setMessage("Account created successfully.");
    setForm(createInitialForm());
  }

  function updateRole(role: CreateAccountRole) {
    setForm((prev) => ({ ...prev, role }));
  }

  return {
    form,
    setForm,
    message,
    created,
    pending,
    submitForm,
    updateRole
  };
}
