"use client";

import { useEffect, useState } from "react";
import { COUNTRY_OPTIONS } from "@/lib/country-options";
import type { AccountInfo, ProfileInfo } from "@/app/admin/accounts/manage/_components/account-info-sections";

type ProfileEditDraft = {
  firstNameKo: string;
  lastNameKo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
  termTimeAddress: {
    country: string;
    addressLine1: string;
    addressLine2: string;
    postCode: string;
  };
  homeAddress: {
    country: string;
    addressLine1: string;
    addressLine2: string;
    postCode: string;
  };
};

type AccountProfileEditDialogProps = {
  open: boolean;
  pending: boolean;
  error: string;
  account: AccountInfo;
  onClose: () => void;
  onSave: (payload: {
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
  }) => Promise<void>;
};

function toDraft(profile: ProfileInfo): ProfileEditDraft {
  return {
    firstNameKo: profile.firstNameKo ?? "",
    lastNameKo: profile.lastNameKo ?? "",
    firstName: profile.firstNameEn ?? "",
    middleName: profile.middleNameEn ?? "",
    lastName: profile.lastNameEn ?? "",
    nationality: profile.nationality ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    email: profile.email ?? "",
    termTimeAddress: {
      country: profile.termTimeAddress.country ?? "",
      addressLine1: profile.termTimeAddress.addressLine1 ?? "",
      addressLine2: profile.termTimeAddress.addressLine2 ?? "",
      postCode: profile.termTimeAddress.postCode ?? ""
    },
    homeAddress: {
      country: profile.homeAddress.country ?? "",
      addressLine1: profile.homeAddress.addressLine1 ?? "",
      addressLine2: profile.homeAddress.addressLine2 ?? "",
      postCode: profile.homeAddress.postCode ?? ""
    }
  };
}

function AddressFields({
  title,
  value,
  onChange
}: {
  title: string;
  value: ProfileEditDraft["termTimeAddress"];
  onChange: (next: ProfileEditDraft["termTimeAddress"]) => void;
}) {
  return (
    <section className="panel stack">
      <span className="eyebrow">{title}</span>
      <section className="grid cols-3">
        <label className="stack">
          <span className="eyebrow">Country</span>
          <select required value={value.country} onChange={(event) => onChange({ ...value, country: event.target.value })}>
            <option value="">Select country</option>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
        <label className="stack address-line-wide">
          <span className="eyebrow">Address Line 1</span>
          <input required value={value.addressLine1} onChange={(event) => onChange({ ...value, addressLine1: event.target.value })} />
        </label>
      </section>
      <section className="grid cols-2">
        <label className="stack">
          <span className="eyebrow">Address Line 2 (Optional)</span>
          <input value={value.addressLine2} onChange={(event) => onChange({ ...value, addressLine2: event.target.value })} />
        </label>
        <label className="stack">
          <span className="eyebrow">Post Code</span>
          <input required value={value.postCode} onChange={(event) => onChange({ ...value, postCode: event.target.value })} />
        </label>
      </section>
    </section>
  );
}

export default function AccountProfileEditDialog({
  open,
  pending,
  error,
  account,
  onClose,
  onSave
}: AccountProfileEditDialogProps) {
  const [draft, setDraft] = useState<ProfileEditDraft | null>(account.profile ? toDraft(account.profile) : null);

  useEffect(() => {
    setDraft(account.profile ? toDraft(account.profile) : null);
  }, [account]);

  if (!open || !draft) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel stack" role="dialog" aria-modal="true" aria-label="Edit account profile">
        <div className="split-row">
          <span className="eyebrow">Edit Personal Information</span>
          <button className="button secondary" type="button" onClick={onClose} disabled={pending}>
            Close
          </button>
        </div>

        {error ? <p className="danger">{error}</p> : null}

        <section className="grid cols-2">
          <label className="stack">
            <span className="eyebrow">First name (Korean)</span>
            <input required value={draft.firstNameKo} onChange={(event) => setDraft({ ...draft, firstNameKo: event.target.value })} />
          </label>
          <label className="stack">
            <span className="eyebrow">Last name (Korean)</span>
            <input required value={draft.lastNameKo} onChange={(event) => setDraft({ ...draft, lastNameKo: event.target.value })} />
          </label>
        </section>
        <section className="grid cols-3">
          <label className="stack">
            <span className="eyebrow">First name (English)</span>
            <input required value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} />
          </label>
          <label className="stack">
            <span className="eyebrow">Middle name (English, optional)</span>
            <input value={draft.middleName} onChange={(event) => setDraft({ ...draft, middleName: event.target.value })} />
          </label>
          <label className="stack">
            <span className="eyebrow">Last name (English)</span>
            <input required value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} />
          </label>
        </section>

        <section className="grid cols-3">
          <label className="stack">
            <span className="eyebrow">Nationality</span>
            <select required value={draft.nationality} onChange={(event) => setDraft({ ...draft, nationality: event.target.value })}>
              <option value="">Select country</option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span className="eyebrow">Date of Birth</span>
            <input
              required
              type="date"
              value={draft.dateOfBirth}
              onChange={(event) => setDraft({ ...draft, dateOfBirth: event.target.value })}
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Email</span>
            <input required type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
          </label>
        </section>

        {account.role === "STUDENT" ? (
          <>
            <AddressFields
              title="Term Time Address"
              value={draft.termTimeAddress}
              onChange={(next) => setDraft({ ...draft, termTimeAddress: next })}
            />
            <AddressFields title="Home Address" value={draft.homeAddress} onChange={(next) => setDraft({ ...draft, homeAddress: next })} />
          </>
        ) : null}

        <div className="inline-actions">
          <button className="button" type="button" disabled={pending} onClick={() => void onSave(draft)}>
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </section>
    </div>
  );
}
