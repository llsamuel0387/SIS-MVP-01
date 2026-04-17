"use client";

import { getUiErrorMessage } from "@/lib/client-error";
import {
  deleteAccountById,
  getAccountDetail,
  resetAccountPassword,
  updateAccountProfile,
  updateStudentSegmentation,
  updateAccountStaffTier,
  updateAccountStatus,
  updateStudentEnrollmentStatus
} from "@/lib/admin-accounts-client";
import type { StaffTierCode } from "@/lib/permissions";
import type { AccountInfo } from "@/app/admin/accounts/manage/_components/account-info-sections";

type UseAccountActionsInput = {
  setPendingId: (value: string | null) => void;
  setError: (value: string) => void;
  setMessage: (value: string) => void;
  setPasswordResetError: (value: string) => void;
  setPasswordCurrentFieldError: (value: string) => void;
  closePasswordDialog: (pendingId: string | null) => void;
  beginInfoDialog: (userId: string) => void;
  finishInfoDialog: (detail: AccountInfo | null, errorMessage?: string) => void;
  reload: () => Promise<void>;
};

export function useAccountActions(input: UseAccountActionsInput) {
  async function updateStatus(userId: string, status: "ACTIVE" | "INACTIVE") {
    input.setPendingId(userId);
    input.setError("");
    input.setMessage("");
    const { ok, data } = await updateAccountStatus(userId, status);
    input.setPendingId(null);

    if (!ok) {
      input.setError(getUiErrorMessage(data, "Failed to update account status"));
      return;
    }
    await input.reload();
  }

  async function deleteAccount(userId: string) {
    input.setPendingId(userId);
    input.setError("");
    input.setMessage("");
    const { ok, data } = await deleteAccountById(userId);
    input.setPendingId(null);

    if (!ok) {
      input.setError(getUiErrorMessage(data, "Failed to delete account"));
      return;
    }
    await input.reload();
  }

  async function updateStaffTier(userId: string, staffTier: StaffTierCode) {
    input.setPendingId(userId);
    input.setError("");
    input.setMessage("");
    const { ok, data } = await updateAccountStaffTier(userId, staffTier);
    input.setPendingId(null);

    if (!ok) {
      input.setError(getUiErrorMessage(data, "Failed to update staff tier"));
      return;
    }
    await input.reload();
  }

  async function updateEnrollmentStatus(userId: string, enrollmentStatus: "ENROLLED" | "NOT_ENROLLED") {
    input.setPendingId(userId);
    input.setError("");
    input.setMessage("");
    const { ok, data } = await updateStudentEnrollmentStatus(userId, enrollmentStatus);
    input.setPendingId(null);

    if (!ok) {
      input.setError(getUiErrorMessage(data, "Failed to update enrolment status"));
      return;
    }
    await input.reload();
  }

  async function resetPassword(
    payload: { newPassword: string; currentPassword?: string },
    target: { userId: string; loginId: string } | null
  ) {
    if (!target) {
      return;
    }
    input.setPendingId(target.userId);
    input.setError("");
    input.setPasswordResetError("");
    input.setPasswordCurrentFieldError("");
    input.setMessage("");

    const { ok, data } = await resetAccountPassword(
      target.userId,
      payload.newPassword,
      payload.currentPassword
    );
    input.setPendingId(null);
    if (!ok) {
      const dataObj = data as { details?: { fields?: Array<{ path?: string; message?: string }> } };
      const currentMsg = dataObj.details?.fields?.find((f) => f.path === "currentPassword")?.message;
      if (currentMsg) {
        input.setPasswordCurrentFieldError(currentMsg);
        return;
      }
      input.setPasswordResetError(getUiErrorMessage(data, "Failed to reset password"));
      return;
    }

    input.setMessage(`Password updated for ${target.loginId}.`);
    input.closePasswordDialog(null);
  }

  async function openInfo(userId: string) {
    input.beginInfoDialog(userId);
    const { ok, data } = await getAccountDetail<AccountInfo>(userId);
    if (!ok) {
      input.finishInfoDialog(null, getUiErrorMessage(data, "Failed to load account details"));
      return;
    }
    input.finishInfoDialog(data);
  }

  async function updateSegmentation(account: AccountInfo, segmentation: { department?: string; pathway?: string }) {
    input.setPendingId(account.id);
    input.setError("");
    input.setMessage("");
    const { ok, data } = await updateStudentSegmentation(account.id, segmentation);
    input.setPendingId(null);
    if (!ok) {
      input.setError(getUiErrorMessage(data, "Failed to update student segmentation"));
      return;
    }
    input.setMessage(`Segmentation updated for ${account.loginId}.`);
    await openInfo(account.id);
    await input.reload();
  }

  async function updateProfile(
    account: AccountInfo,
    profile: {
      firstNameKo: string;
      lastNameKo: string;
      firstName: string;
      middleName?: string;
      lastName: string;
      nationality: string;
      dateOfBirth: string;
      email: string;
      termTimeAddress?: {
        country: string;
        addressLine1: string;
        addressLine2?: string;
        postCode: string;
      };
      homeAddress?: {
        country: string;
        addressLine1: string;
        addressLine2?: string;
        postCode: string;
      };
    }
  ): Promise<boolean> {
    input.setPendingId(account.id);
    input.setError("");
    input.setMessage("");
    const { ok, data } = await updateAccountProfile(account.id, profile);
    input.setPendingId(null);
    if (!ok) {
      input.setError(getUiErrorMessage(data, "Failed to update profile"));
      return false;
    }
    input.setMessage(`Profile updated for ${account.loginId}.`);
    await openInfo(account.id);
    await input.reload();
    return true;
  }

  return {
    updateStatus,
    updateEnrollmentStatus,
    updateStaffTier,
    deleteAccount,
    resetPassword,
    openInfo,
    updateSegmentation,
    updateProfile
  };
}
