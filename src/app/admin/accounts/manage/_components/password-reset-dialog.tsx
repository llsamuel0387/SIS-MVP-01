"use client";

import { useEffect, useState } from "react";

export type PasswordResetSubmitPayload = {
  newPassword: string;
  currentPassword?: string;
};

type PasswordResetDialogProps = {
  open: boolean;
  loginId: string;
  requireCurrentPassword?: boolean;
  currentPasswordFieldError?: string;
  pending: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: PasswordResetSubmitPayload) => Promise<void>;
};

export default function PasswordResetDialog({
  open,
  loginId,
  requireCurrentPassword = false,
  currentPasswordFieldError = "",
  pending,
  error,
  onClose,
  onSubmit
}: PasswordResetDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [confirmFieldError, setConfirmFieldError] = useState("");

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLocalError("");
      setConfirmFieldError("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");
    setConfirmFieldError("");

    if (requireCurrentPassword && !currentPassword.trim()) {
      setLocalError("Current password is required.");
      return;
    }

    if (newPassword.length < 10) {
      setLocalError("Password must be at least 10 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmFieldError("Passwords do not match.");
      return;
    }

    await onSubmit({
      newPassword,
      currentPassword: requireCurrentPassword ? currentPassword : undefined
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel stack" role="dialog" aria-modal="true" aria-label="Password Reset">
        <div className="stack-xs">
          <span className="eyebrow">Password Reset</span>
          <h2>Reset Password: {loginId}</h2>
          <p className="muted">Set a new policy-compliant password.</p>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          {requireCurrentPassword ? (
            <label className="stack-sm">
              <span className="eyebrow">Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              {currentPasswordFieldError ? <p className="danger">{currentPasswordFieldError}</p> : null}
            </label>
          ) : null}

          <label className="stack-sm">
            <span className="eyebrow">New Password</span>
            <input
              type="password"
              minLength={10}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          <label className="stack-sm">
            <span className="eyebrow">Confirm Password</span>
            <input
              type="password"
              minLength={10}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
            {confirmFieldError ? <p className="danger">{confirmFieldError}</p> : null}
          </label>

          {localError ? <p className="danger">{localError}</p> : null}
          {error ? <p className="danger">{error}</p> : null}

          <div className="inline-actions align-end">
            <button className="button secondary" type="button" onClick={onClose} disabled={pending}>
              Cancel
            </button>
            <button className="button" type="submit" disabled={pending}>
              {pending ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
