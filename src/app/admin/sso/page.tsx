"use client";

import AdminPageShell from "@/app/admin/_components/admin-page-shell";
import SsoSettingsFeedback from "@/app/admin/sso/_components/sso-settings-feedback";
import SsoProviderList from "@/app/admin/sso/_components/sso-provider-list";
import { useSsoProviders } from "@/app/admin/sso/_hooks/use-sso-providers";

export default function AdminSsoSettingsPage() {
  const { rows, secretDrafts, setSecretDrafts, message, error, pendingProvider, updateDraft, saveProvider } = useSsoProviders();

  return (
    <AdminPageShell
      includeSsoLink
      heroBadge="Admin / SSO Settings"
      heroTitle="External SSO Settings"
      heroDescription="Configure Microsoft and OneLogin providers."
    >
      <SsoSettingsFeedback message={message} error={error} />
      <SsoProviderList
        rows={rows}
        secretDrafts={secretDrafts}
        pendingProvider={pendingProvider}
        onChange={updateDraft}
        onSecretChange={(provider, value) => setSecretDrafts((prev) => ({ ...prev, [provider]: value }))}
        onSave={saveProvider}
      />
    </AdminPageShell>
  );
}
