"use client";

import { useEffect, useState } from "react";
import AdminPageShell from "@/app/admin/_components/admin-page-shell";
import CreateAccountForm from "@/app/admin/accounts/create/_components/create-account-form";
import CreateAccountResult from "@/app/admin/accounts/create/_components/create-account-result";
import { useCreateAccount } from "@/app/admin/accounts/create/_hooks/use-create-account";
import { getSegmentationConfig } from "@/lib/student-segmentation-client";
import { getUiErrorMessage } from "@/lib/client-error";
import type { StudentSegmentationConfig } from "@/lib/student-segmentation";

export default function AdminCreateAccountPage() {
  const { form, setForm, message, created, pending, submitForm, updateRole } = useCreateAccount();
  const [segmentationConfig, setSegmentationConfig] = useState<StudentSegmentationConfig | null>(null);
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { ok, data } = await getSegmentationConfig();
      if (!mounted) {
        return;
      }
      if (!ok) {
        setConfigError(getUiErrorMessage(data, "Failed to load segmentation options"));
        return;
      }
      setSegmentationConfig(data);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminPageShell
      heroBadge="Admin / Create Account"
      heroTitle="Create Account"
      heroDescription="Admin-only user provisioning."
    >
      {configError ? <p className="notice notice-error">{configError}</p> : null}
      <section className="grid cols-2">
        <section className="panel stack-sm">
          <span className="eyebrow">Create Workflow</span>
          <p className="muted">Select role, enter profile details, set an initial password, then create.</p>
          <CreateAccountForm
            form={form}
            pending={pending}
            onSubmit={submitForm}
            onRoleChange={updateRole}
            onFormChange={setForm}
            segmentationConfig={segmentationConfig}
          />
        </section>
        <section className="stack">
          <section className="panel stack-sm">
            <span className="eyebrow">Operator Note</span>
            <p className="muted">Student department/pathway and address fields are used for downstream access checks.</p>
          </section>
          <CreateAccountResult message={message} created={created} />
        </section>
      </section>
    </AdminPageShell>
  );
}
