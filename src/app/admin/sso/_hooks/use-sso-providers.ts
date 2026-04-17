"use client";

import { useEffect, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import { listSsoProviders, saveSsoProvider, type SsoProvider, type SsoProviderRow } from "@/lib/admin-sso-client";

export function useSsoProviders() {
  const [rows, setRows] = useState<SsoProviderRow[]>([]);
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  async function loadProviders() {
    setError("");
    const { ok, data } = await listSsoProviders();
    if (!ok) {
      setError(getUiErrorMessage(data, "Failed to load SSO settings"));
      setRows([]);
      return;
    }
    setRows(data);
  }

  useEffect(() => {
    void loadProviders();
  }, []);

  function updateDraft(provider: SsoProvider, key: keyof SsoProviderRow, value: string | boolean) {
    setRows((prev) => prev.map((row) => (row.provider === provider ? { ...row, [key]: value } : row)));
  }

  async function saveProvider(provider: SsoProviderRow) {
    setPendingProvider(provider.provider);
    setMessage("");
    setError("");
    const { ok, data } = await saveSsoProvider(provider, secretDrafts[provider.provider] || "");
    setPendingProvider(null);
    if (!ok) {
      setError(getUiErrorMessage(data, "Failed to save SSO settings"));
      return;
    }
    setMessage(`${provider.provider} settings saved.`);
    setSecretDrafts((prev) => ({ ...prev, [provider.provider]: "" }));
    await loadProviders();
  }

  return {
    rows,
    secretDrafts,
    setSecretDrafts,
    message,
    error,
    pendingProvider,
    updateDraft,
    saveProvider
  };
}
