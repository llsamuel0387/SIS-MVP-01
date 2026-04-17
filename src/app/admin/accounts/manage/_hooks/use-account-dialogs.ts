"use client";

import { useState } from "react";
import type { AccountInfo } from "@/app/admin/accounts/manage/_components/account-info-sections";

export function useAccountDialogs() {
  const [passwordTarget, setPasswordTarget] = useState<{ userId: string; loginId: string } | null>(null);
  const [passwordResetError, setPasswordResetError] = useState("");
  const [passwordCurrentFieldError, setPasswordCurrentFieldError] = useState("");
  const [infoTargetId, setInfoTargetId] = useState<string | null>(null);
  const [infoPending, setInfoPending] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [infoDetail, setInfoDetail] = useState<AccountInfo | null>(null);

  function openPasswordDialog(userId: string, loginId: string) {
    setPasswordResetError("");
    setPasswordCurrentFieldError("");
    setPasswordTarget({ userId, loginId });
  }

  function closePasswordDialog(pendingId: string | null) {
    if (pendingId) {
      return;
    }
    setPasswordTarget(null);
    setPasswordResetError("");
    setPasswordCurrentFieldError("");
  }

  function beginInfoDialog(userId: string) {
    setInfoTargetId(userId);
    setInfoPending(true);
    setInfoError("");
    setInfoDetail(null);
  }

  function finishInfoDialog(detail: AccountInfo | null, errorMessage?: string) {
    setInfoPending(false);
    if (errorMessage) {
      setInfoError(errorMessage);
      return;
    }
    setInfoDetail(detail);
  }

  function closeInfoDialog() {
    if (infoPending) {
      return;
    }
    setInfoTargetId(null);
    setInfoDetail(null);
    setInfoError("");
  }

  return {
    passwordTarget,
    passwordResetError,
    passwordCurrentFieldError,
    setPasswordResetError,
    setPasswordCurrentFieldError,
    openPasswordDialog,
    closePasswordDialog,
    infoTargetId,
    infoPending,
    infoError,
    infoDetail,
    beginInfoDialog,
    finishInfoDialog,
    closeInfoDialog
  };
}
