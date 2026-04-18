"use client";

import { useEffect, useMemo, useState } from "react";
import { secureClientFetch } from "@/lib/browser-security";
import { parseFetchResponseJson } from "@/lib/parse-fetch-response-json";
import type { AccountRoleFilter } from "@/lib/admin-accounts-client";
import { ACCOUNT_ROLE_FILTER_OPTIONS } from "@/app/admin/accounts/manage/_config/account-role-filter";
import { useAccountActions } from "@/app/admin/accounts/manage/_hooks/use-account-actions";
import { useAccountDialogs } from "@/app/admin/accounts/manage/_hooks/use-account-dialogs";
import { useAccountList } from "@/app/admin/accounts/manage/_hooks/use-account-list";

export function useAccountManagePage() {
  const [roleFilter, setRoleFilter] = useState<AccountRoleFilter>("ALL");
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [actorUserId, setActorUserId] = useState<string | null>(null);
  const {
    rows,
    page,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    error,
    setError,
    reload,
    goToNextPage,
    goToPreviousPage
  } = useAccountList(roleFilter, appliedSearch);
  const dialogs = useAccountDialogs();
  const actions = useAccountActions({
    setPendingId,
    setError,
    setMessage,
    setPasswordResetError: dialogs.setPasswordResetError,
    setPasswordCurrentFieldError: dialogs.setPasswordCurrentFieldError,
    closePasswordDialog: dialogs.closePasswordDialog,
    beginInfoDialog: dialogs.beginInfoDialog,
    finishInfoDialog: dialogs.finishInfoDialog,
    reload
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await secureClientFetch("/api/me");
        if (cancelled || !response.ok) {
          return;
        }
        const { data: body } = await parseFetchResponseJson<{ id?: string }>(response);
        if (body.id) {
          setActorUserId(body.id);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const roleFilterLabel = useMemo(() => {
    return ACCOUNT_ROLE_FILTER_OPTIONS.find((option) => option.id === roleFilter)?.heading ?? roleFilter;
  }, [roleFilter]);

  return {
    roleFilter,
    setRoleFilter,
    roleFilterLabel,
    message,
    error,
    pendingId,
    appliedSearch,
    setAppliedSearch,
    rows,
    page,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    dialogs,
    actions,
    actorUserId
  };
}
