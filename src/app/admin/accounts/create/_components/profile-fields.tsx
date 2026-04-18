"use client";

import { useState, type ChangeEvent } from "react";
import {
  DEFAULT_STUDENT_SEGMENTATION_LABELS,
  DEFAULT_STUDENT_SEGMENTATION_CONFIG,
  getDepartmentOptions,
  getPathwayOptionsByDepartment,
  createEmptyStudentSegmentation,
  type StudentSegmentationConfig,
  type StudentSegmentationValues
} from "@/lib/student-segmentation";
import { type StaffTierCode } from "@/lib/permissions";
import {
  STAFF_TIER_OPTIONS,
  getStaffTierLabel
} from "@/app/admin/accounts/_config/staff-tier-options";
import SegmentationOptionInput from "@/app/admin/accounts/_components/segmentation-option-input";
import { COUNTRY_OPTIONS } from "@/lib/country-options";

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

type StudentAddress = {
  country: string;
  addressLine1: string;
  addressLine2: string;
  postCode: string;
};

export type StudentProfileDraft = {
  photoPngBase64: string;
  firstNameKo: string;
  lastNameKo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
  termTimeAddress: StudentAddress;
  homeAddress: StudentAddress;
  segmentation: Required<StudentSegmentationValues>;
};

export type StaffProfileDraft = {
  photoPngBase64: string;
  firstNameKo: string;
  lastNameKo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
  staffTier: StaffTierCode;
};

type StudentFieldsProps = {
  value: StudentProfileDraft;
  onChange: (next: StudentProfileDraft) => void;
  segmentationConfig?: StudentSegmentationConfig | null;
};

type StaffFieldsProps = {
  value: StaffProfileDraft;
  onChange: (next: StaffProfileDraft) => void;
};

function IdentityFields({
  photoPngBase64,
  firstNameKo,
  lastNameKo,
  firstName,
  middleName,
  lastName,
  nationality,
  dateOfBirth,
  email,
  onChange
}: {
  photoPngBase64: string;
  firstNameKo: string;
  lastNameKo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
  onChange: (key: string, value: string) => void;
}) {
  const [photoError, setPhotoError] = useState("");
  const [photoFileName, setPhotoFileName] = useState("");
  const [photoPending, setPhotoPending] = useState(false);

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
      onChange("photoPngBase64", "");
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
      onChange("photoPngBase64", base64);
    } catch {
      setPhotoError("Failed to process image file.");
      setPhotoFileName("");
      event.target.value = "";
      onChange("photoPngBase64", "");
    } finally {
      setPhotoPending(false);
    }
  }

  return (
    <>
      <div className="stack">
        <span className="eyebrow">Photo (Image Optional)</span>
        <input
          className="file-input"
          type="file"
          accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.heif"
          onChange={onPhotoSelect}
        />
        <span className="muted">Mac: Finder, Windows: File Explorer, Mobile: Photos/Files picker</span>
        <div className="inline-actions">
          {photoPngBase64 ? (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setPhotoFileName("");
                setPhotoError("");
                onChange("photoPngBase64", "");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
        {photoPending ? (
          <span className="muted">Processing image...</span>
        ) : photoPngBase64 ? (
          <span className="muted">Selected: {photoFileName || "Image uploaded"}</span>
        ) : (
          <span className="muted">Not uploaded</span>
        )}
        {photoError ? <span className="danger">{photoError}</span> : null}
      </div>
      <section className="grid cols-2">
        <label className="stack">
          <span className="eyebrow">First name (Korean)</span>
          <input required value={firstNameKo} onChange={(event) => onChange("firstNameKo", event.target.value)} />
        </label>
        <label className="stack">
          <span className="eyebrow">Last name (Korean)</span>
          <input required value={lastNameKo} onChange={(event) => onChange("lastNameKo", event.target.value)} />
        </label>
      </section>
      <section className="grid cols-3">
        <label className="stack">
          <span className="eyebrow">First name (English)</span>
          <input required value={firstName} onChange={(event) => onChange("firstName", event.target.value)} />
        </label>
        <label className="stack">
          <span className="eyebrow">Middle name (English, optional)</span>
          <input value={middleName} onChange={(event) => onChange("middleName", event.target.value)} />
        </label>
        <label className="stack">
          <span className="eyebrow">Last name (English)</span>
          <input required value={lastName} onChange={(event) => onChange("lastName", event.target.value)} />
        </label>
      </section>
      <section className="grid cols-3">
        <label className="stack">
          <span className="eyebrow">Nationality</span>
          <select required value={nationality} onChange={(event) => onChange("nationality", event.target.value)}>
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
          <input required type="date" value={dateOfBirth} onChange={(event) => onChange("dateOfBirth", event.target.value)} />
        </label>
        <label className="stack">
          <span className="eyebrow">Email</span>
          <input required type="email" value={email} onChange={(event) => onChange("email", event.target.value)} />
        </label>
      </section>
    </>
  );
}

function AddressFields({
  title,
  value,
  onChange
}: {
  title: string;
  value: StudentAddress;
  onChange: (next: StudentAddress) => void;
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

export function StudentProfileFields({ value, onChange, segmentationConfig }: StudentFieldsProps) {
  const labels = DEFAULT_STUDENT_SEGMENTATION_LABELS;
  const config = segmentationConfig ?? DEFAULT_STUDENT_SEGMENTATION_CONFIG;
  const departmentOptions = getDepartmentOptions(config);
  const pathwayOptions = getPathwayOptionsByDepartment(config, value.segmentation.department);
  return (
    <section className="stack">
      <IdentityFields
        photoPngBase64={value.photoPngBase64}
        firstNameKo={value.firstNameKo}
        lastNameKo={value.lastNameKo}
        firstName={value.firstName}
        middleName={value.middleName}
        lastName={value.lastName}
        nationality={value.nationality}
        dateOfBirth={value.dateOfBirth}
        email={value.email}
        onChange={(key, next) => onChange({ ...value, [key]: next })}
      />
      <AddressFields
        title="Term Time Address"
        value={value.termTimeAddress}
        onChange={(next) => onChange({ ...value, termTimeAddress: next })}
      />
      <AddressFields title="Home Address" value={value.homeAddress} onChange={(next) => onChange({ ...value, homeAddress: next })} />
      <section className="panel stack">
        <span className="eyebrow">Student Segmentation</span>
        <p className="muted">These keys are intentionally fixed for now and labels can be customized later by authorized staff.</p>
        <section className="grid cols-3">
          <SegmentationOptionInput
            label={labels.department}
            value={value.segmentation.department}
            options={departmentOptions}
            placeholder="Select department"
            onChange={(nextDepartment) =>
              onChange({
                ...value,
                segmentation: {
                  ...value.segmentation,
                  department: nextDepartment,
                  pathway:
                    nextDepartment === value.segmentation.department
                      ? value.segmentation.pathway
                      : ""
                }
              })
            }
          />
          <SegmentationOptionInput
            label={labels.pathway}
            value={value.segmentation.pathway}
            options={pathwayOptions}
            placeholder="Select pathway"
            onChange={(nextPathway) =>
              onChange({
                ...value,
                segmentation: { ...value.segmentation, pathway: nextPathway }
              })
            }
          />
        </section>
        {/* Class input UI is intentionally hidden for now. */}
        <button
          className="button secondary"
          type="button"
          onClick={() =>
            onChange({
              ...value,
              segmentation: createEmptyStudentSegmentation()
            })
          }
        >
          Clear Segmentation
        </button>
      </section>
    </section>
  );
}

export function StaffProfileFields({ value, onChange }: StaffFieldsProps) {
  return (
    <section className="stack">
      <label className="stack">
        <span className="eyebrow">Staff Authority Tier</span>
        <select
          value={value.staffTier}
          onChange={(event) => onChange({ ...value, staffTier: event.target.value as StaffTierCode })}
        >
          {STAFF_TIER_OPTIONS.map((tier) => (
            <option key={tier} value={tier}>
              {getStaffTierLabel(tier)}
            </option>
          ))}
        </select>
      </label>
      <IdentityFields
        photoPngBase64={value.photoPngBase64}
        firstNameKo={value.firstNameKo}
        lastNameKo={value.lastNameKo}
        firstName={value.firstName}
        middleName={value.middleName}
        lastName={value.lastName}
        nationality={value.nationality}
        dateOfBirth={value.dateOfBirth}
        email={value.email}
        onChange={(key, next) => onChange({ ...value, [key]: next })}
      />
    </section>
  );
}
