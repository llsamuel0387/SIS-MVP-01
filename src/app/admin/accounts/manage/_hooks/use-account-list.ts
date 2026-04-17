"use client";

import { useCallback, useEffect, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import { listAccounts, type AccountRoleFilter, type AccountRow } from "@/lib/admin-accounts-client";

export function useAccountList(roleFilter: AccountRoleFilter, appliedSearch: string) {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    const { ok, data } = await listAccounts(roleFilter, appliedSearch || undefined);
    if (!ok) {
      setRows([]);
      setError(getUiErrorMessage(data, "Failed to load account list"));
      return;
    }
    setRows(data);
  }, [appliedSearch, roleFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    rows,
    error,
    setError,
    reload
  };
}
