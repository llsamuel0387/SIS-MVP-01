"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { secureClientFetch } from "@/lib/browser-security";
import { parseFetchResponseJson } from "@/lib/parse-fetch-response-json";

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
  actorUserId: string | null;
};

type ApiField = { path?: string; message?: string };

export default function ChangePasswordModal({ open, onClose, actorUserId }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [genericError, setGenericError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPasswordError("");
      setConfirmPasswordError("");
      setGenericError("");
      setPending(false);
    }
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPasswordError("");
    setConfirmPasswordError("");
    setGenericError("");

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    if (!actorUserId) {
      setGenericError("Could not load your account. Please refresh the page.");
      return;
    }

    setPending(true);
    let response: Response;
    try {
      response = await secureClientFetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetUserId: actorUserId,
          currentPassword,
          newPassword
        })
      });
    } catch {
      setPending(false);
      setGenericError("Could not reach the server. Please try again.");
      return;
    }
    setPending(false);

    if (response.ok) {
      onClose();
      return;
    }

    const { data: payload } = await parseFetchResponseJson<{ details?: { fields?: ApiField[] }; error?: { message?: string } }>(
      response
    );

    const fieldErrors = payload.details?.fields ?? [];
    const currentMsg = fieldErrors.find((f) => f.path === "currentPassword")?.message;
    if (currentMsg) {
      setCurrentPasswordError(currentMsg);
    }
    const confirmMsg = fieldErrors.find((f) => f.path === "confirmPassword")?.message;
    if (confirmMsg) {
      setConfirmPasswordError(confirmMsg);
    }
    if (!currentMsg && !confirmMsg) {
      setGenericError(payload.error?.message ?? "Password change failed. Please try again.");
    }
  }

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel stack" role="dialog" aria-modal="true" aria-label="Change Password">
        <div className="stack-xs">
          <span className="eyebrow">Security</span>
          <h2>Change Password</h2>
          <p className="muted">Enter your current password and a new policy-compliant password.</p>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="stack-sm">
            <span className="eyebrow">Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            {currentPasswordError ? <p className="danger">{currentPasswordError}</p> : null}
          </label>

          <label className="stack-sm">
            <span className="eyebrow">New password</span>
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
            <span className="eyebrow">Confirm new password</span>
            <input
              type="password"
              minLength={10}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
            {confirmPasswordError ? <p className="danger">{confirmPasswordError}</p> : null}
          </label>

          {genericError ? <p className="danger">{genericError}</p> : null}

          <div className="inline-actions align-end">
            <button className="button secondary" type="button" onClick={onClose} disabled={pending}>
              Cancel
            </button>
            <button className="button" type="submit" disabled={pending || !actorUserId}>
              {pending ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
