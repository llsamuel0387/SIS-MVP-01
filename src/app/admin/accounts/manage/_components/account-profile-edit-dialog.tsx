"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { COUNTRY_OPTIONS } from "@/lib/country-options";
import type { AccountInfo, ProfileInfo } from "@/app/admin/accounts/manage/_components/account-info-sections";

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

type ProfileEditDraft = {
  photoPngBase64: string;
  removePhoto: boolean;
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
    photoPngBase64?: string;
    removePhoto?: boolean;
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
    photoPngBase64: "",
    removePhoto: false,
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
  const [photoError, setPhotoError] = useState("");
  const [photoFileName, setPhotoFileName] = useState("");
  const [photoPending, setPhotoPending] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const initialDraft = account.profile ? toDraft(account.profile) : null;
  const hasUnsavedChanges = initialDraft && draft ? JSON.stringify(draft) !== JSON.stringify(initialDraft) : false;

  useEffect(() => {
    setDraft(account.profile ? toDraft(account.profile) : null);
    setPhotoError("");
    setPhotoFileName("");
    setPhotoPending(false);
    setConfirmCloseOpen(false);
  }, [account]);

  function requestClose() {
    if (pending || photoPending) {
      return;
    }
    if (hasUnsavedChanges) {
      setConfirmCloseOpen(true);
      return;
    }
    onClose();
  }

  async function readAsBase64(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        const base64 = result.includes(",") ? result.split(",")[1] ?? "" : "";
        if (!base64) {
          reject(new Error("Image data is empty."));
          return;
        }
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
  }

  async function onPhotoSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoError("");
      setPhotoFileName("");
      setDraft((prev) => (prev ? { ...prev, photoPngBase64: "", removePhoto: false } : prev));
      return;
    }
    if (file.type && !file.type.startsWith("image/")) {
      setPhotoError("Only image files can be uploaded.");
      setPhotoFileName("");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setPhotoError("Image size must be 10MB or less.");
      setPhotoFileName("");
      event.target.value = "";
      return;
    }
    setPhotoPending(true);
    try {
      const base64 = await readAsBase64(file);
      setPhotoError("");
      setPhotoFileName(file.name);
      setDraft((prev) => (prev ? { ...prev, photoPngBase64: base64, removePhoto: false } : prev));
    } catch {
      setPhotoError("Failed to process image file.");
      setPhotoFileName("");
      event.target.value = "";
      setDraft((prev) => (prev ? { ...prev, photoPngBase64: "", removePhoto: false } : prev));
    } finally {
      setPhotoPending(false);
    }
  }

  if (!open || !draft) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel stack" role="dialog" aria-modal="true" aria-label="Edit account profile">
        <div className="split-row">
          <span className="eyebrow">Edit Personal Information</span>
          <button className="button secondary" type="button" onClick={requestClose} disabled={pending || photoPending}>
            Close
          </button>
        </div>

        {error ? <p className="danger">{error}</p> : null}

        <section className="panel stack">
          <span className="eyebrow">Profile Photo</span>
          <p className="muted">
            Uploading a new image will replace the current photo for this account.
          </p>
          {draft.removePhoto ? (
            <p className="muted">Current photo will be removed when you save.</p>
          ) : account.photoDataUrl ? (
            <Image
              className="profile-photo"
              src={account.photoDataUrl}
              alt={`${account.name || account.loginId} current profile`}
              width={160}
              height={160}
              unoptimized
            />
          ) : (
            <p className="muted">No current profile photo.</p>
          )}
          <input
            className="file-input"
            type="file"
            accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.heif"
            onChange={onPhotoSelect}
            disabled={pending || photoPending}
          />
          <div className="inline-actions">
            {account.photoDataUrl && !draft.photoPngBase64 && !draft.removePhoto ? (
              <button
                className="button secondary"
                type="button"
                disabled={pending || photoPending}
                onClick={() => {
                  setPhotoError("");
                  setPhotoFileName("");
                  setDraft({ ...draft, photoPngBase64: "", removePhoto: true });
                }}
              >
                Remove Current Photo
              </button>
            ) : null}
            {draft.photoPngBase64 ? (
              <button
                className="button secondary"
                type="button"
                disabled={pending || photoPending}
                onClick={() => {
                  setPhotoError("");
                  setPhotoFileName("");
                  setDraft({ ...draft, photoPngBase64: "", removePhoto: false });
                }}
              >
                Cancel New Photo
              </button>
            ) : null}
            {draft.removePhoto ? (
              <button
                className="button secondary"
                type="button"
                disabled={pending || photoPending}
                onClick={() => {
                  setPhotoError("");
                  setPhotoFileName("");
                  setDraft({ ...draft, removePhoto: false });
                }}
              >
                Keep Current Photo
              </button>
            ) : null}
          </div>
          {photoPending ? (
            <span className="muted">Processing image...</span>
          ) : draft.photoPngBase64 ? (
            <span className="muted">Selected: {photoFileName || "Image uploaded"}</span>
          ) : draft.removePhoto ? (
            <span className="muted">Current photo will be deleted.</span>
          ) : (
            <span className="muted">Keep current photo</span>
          )}
          {photoError ? <span className="danger">{photoError}</span> : null}
        </section>

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
          <button className="button" type="button" disabled={pending || photoPending} onClick={() => void onSave(draft)}>
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </section>

      {confirmCloseOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel stack" role="alertdialog" aria-modal="true" aria-label="Unsaved changes">
            <span className="eyebrow">Unsaved Changes</span>
            <p className="muted">Any unsaved changes will be lost if you exit now.</p>
            <div className="inline-actions align-end">
              <button className="button secondary" type="button" onClick={() => setConfirmCloseOpen(false)}>
                Keep Editing
              </button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  setConfirmCloseOpen(false);
                  onClose();
                }}
              >
                Exit Without Saving
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
