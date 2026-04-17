"use client";

import { useState } from "react";
import type { StaffTierCode } from "@/lib/permissions";
import {
  type AccountInfo,
  AccountIdentitySection,
  AccountProfileSection
} from "@/app/admin/accounts/manage/_components/account-info-sections";
import { STAFF_TIER_OPTIONS, getStaffTierLabel } from "@/app/admin/accounts/_config/staff-tier-options";
import AccountSegmentationEditor from "@/app/admin/accounts/manage/_components/account-segmentation-editor";
import AccountProfileEditDialog from "@/app/admin/accounts/manage/_components/account-profile-edit-dialog";

type AccountInfoDialogProps = {
  open: boolean;
  pending: boolean;
  error: string;
  account: AccountInfo | null;
  onUpdateStaffTier: (userId: string, staffTier: StaffTierCode) => Promise<void>;
  onUpdateSegmentation: (account: AccountInfo, segmentation: { department?: string; pathway?: string }) => Promise<void>;
  onUpdateProfile: (
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
  ) => Promise<boolean>;
  onClose: () => void;
};

export default function AccountInfoDialog({
  open,
  pending,
  error,
  account,
  onUpdateStaffTier,
  onUpdateSegmentation,
  onUpdateProfile,
  onClose
}: AccountInfoDialogProps) {
  const [editing, setEditing] = useState(false);

  if (!open) {
    return null;
  }

  if (!account) {
    return (
      <div className="modal-backdrop" role="presentation">
        <section className="modal-panel stack" role="dialog" aria-modal="true" aria-label="Account information">
          <div className="split-row">
            <span className="eyebrow">Account Information</span>
            <button className="button secondary" type="button" onClick={onClose} disabled={pending}>
              Close
            </button>
          </div>
          {pending ? <p className="muted">Loading...</p> : null}
          {error ? <p className="danger">{error}</p> : null}
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="modal-backdrop" role="presentation">
        <section className="modal-panel stack" role="dialog" aria-modal="true" aria-label="Account information">
          <div className="split-row">
            <span className="eyebrow">Account Information</span>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setEditing(false);
                onClose();
              }}
              disabled={pending}
            >
              Close
            </button>
          </div>

          {pending ? <p className="muted">Loading...</p> : null}
          {error ? <p className="danger">{error}</p> : null}

          <section className="stack">
            <AccountIdentitySection account={account} />

            {account.role === "STAFF" ? (
              <section className="panel stack-sm">
                <span className="eyebrow">Staff authority tier</span>
                <p className="muted">
                  Tier merges extra permissions with the base staff role (see the permissions list above). Typical progression:
                  Staff → Higher staff → Vice-headmaster → Headmaster.
                </p>
                <label className="stack-xs">
                  <span className="eyebrow">Assign tier</span>
                  <select
                    value={account.staffTier ?? "STAFF"}
                    disabled={pending}
                    onChange={(event) => {
                      const tier = event.target.value as StaffTierCode;
                      void onUpdateStaffTier(account.id, tier);
                    }}
                  >
                    {STAFF_TIER_OPTIONS.map((tier) => (
                      <option key={tier} value={tier}>
                        {getStaffTierLabel(tier)}
                      </option>
                    ))}
                  </select>
                </label>
              </section>
            ) : null}

            {account.profile ? (
              <>
                <AccountProfileSection profile={account.profile} />
                {account.role === "STUDENT" ? (
                  <AccountSegmentationEditor account={account} pending={pending} onSave={onUpdateSegmentation} />
                ) : null}
                <div className="inline-actions">
                  <button className="button" type="button" onClick={() => setEditing(true)} disabled={pending}>
                    Edit
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">No profile information.</p>
            )}
          </section>
        </section>
      </div>

      {editing && account.profile ? (
        <AccountProfileEditDialog
          open={editing}
          pending={pending}
          error={error}
          account={account}
          onClose={() => setEditing(false)}
          onSave={async (profile) => {
            const updated = await onUpdateProfile(account, profile);
            if (updated) {
              setEditing(false);
            }
          }}
        />
      ) : null}
    </>
  );
}
