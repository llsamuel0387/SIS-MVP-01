"use client";

import type { StaffTierCode } from "@/lib/permissions";
import { getStaffTierLabel } from "@/app/admin/accounts/_config/staff-tier-options";
import { formatPermissionLabel, sortPermissionCodes } from "@/lib/permission-display";

export type AddressInfo = {
  country: string;
  addressLine1: string;
  addressLine2: string;
  postCode: string;
};

export type ProfileInfo = {
  firstNameKo: string;
  lastNameKo: string;
  firstNameEn: string;
  middleNameEn: string;
  lastNameEn: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
  termTimeAddress: AddressInfo;
  homeAddress: AddressInfo;
  segmentation?: {
    labels: {
      department: string;
      pathway: string;
      class: string;
    };
    values: {
      department: string;
      pathway: string;
      classes: string[];
    };
  };
};

export type AccountInfo = {
  id: string;
  name: string;
  loginId: string;
  role: string;
  permissions?: string[];
  staffTier?: StaffTierCode | null;
  status: string;
  enrollmentStatus?: "ENROLLED" | "NOT_ENROLLED" | null;
  photoDataUrl?: string | null;
  profile: ProfileInfo | null;
};

function AddressCard({ title, value }: { title: string; value: AddressInfo }) {
  const hasValue = Object.values(value).some((item) => item.length > 0);
  if (!hasValue) {
    return null;
  }
  return (
    <section className="panel stack-sm">
      <span className="eyebrow">{title}</span>
      <p>{value.country || "-"}</p>
      <p>{value.addressLine1 || "-"}</p>
      {value.addressLine2 ? <p>{value.addressLine2}</p> : null}
      <p>Post code: {value.postCode || "-"}</p>
    </section>
  );
}

export function AccountIdentitySection({ account }: { account: AccountInfo }) {
  const permissionLabels = sortPermissionCodes(account.permissions ?? []).map((code) => formatPermissionLabel(code));

  return (
    <section className="panel stack">
      <span className="eyebrow">Identity</span>
      {account.photoDataUrl ? (
        <img className="profile-photo" src={account.photoDataUrl} alt={`${account.name || account.loginId} profile`} />
      ) : (
        <p className="muted">No profile photo.</p>
      )}
      <div className="grid cols-2">
        <div className="stack-sm">
          <span className="eyebrow">Name</span>
          <p>{account.name || "-"}</p>
        </div>
        <div className="stack-sm">
          <span className="eyebrow">Login ID</span>
          <p>{account.loginId}</p>
        </div>
        <div className="stack-sm">
          <span className="eyebrow">Role</span>
          <p>{account.role}</p>
        </div>
        {account.role === "STAFF" ? (
          <div className="stack-sm">
            <span className="eyebrow">Staff Tier</span>
            <p>{account.staffTier ? getStaffTierLabel(account.staffTier) : "-"}</p>
          </div>
        ) : null}
        <div className="stack-sm">
          <span className="eyebrow">Status</span>
          <p>{account.status}</p>
        </div>
        {account.role === "STUDENT" ? (
          <div className="stack-sm">
            <span className="eyebrow">Enrolment Status</span>
            <p>{account.enrollmentStatus ?? "NOT_ENROLLED"}</p>
          </div>
        ) : null}
      </div>
      <div className="stack-sm">
        <span className="eyebrow">Permissions</span>
        <p>{permissionLabels.length > 0 ? permissionLabels.join(", ") : "-"}</p>
      </div>
    </section>
  );
}

export function AccountProfileSection({ profile }: { profile: ProfileInfo }) {
  const segmentation = profile.segmentation;
  const hasSegmentation =
    Boolean(segmentation?.values.department) ||
    Boolean(segmentation?.values.pathway);

  return (
    <section className="panel stack">
      <span className="eyebrow">Profile</span>
      <div className="grid cols-2">
        <div className="stack-sm">
          <span className="eyebrow">First name (Korean)</span>
          <p>{profile.firstNameKo || "-"}</p>
        </div>
        <div className="stack-sm">
          <span className="eyebrow">Last name (Korean)</span>
          <p>{profile.lastNameKo || "-"}</p>
        </div>
      </div>
      <div className="grid cols-3">
        <div className="stack-sm">
          <span className="eyebrow">First name (English)</span>
          <p>{profile.firstNameEn || "-"}</p>
        </div>
        <div className="stack-sm">
          <span className="eyebrow">Middle name (English)</span>
          <p>{profile.middleNameEn || "-"}</p>
        </div>
        <div className="stack-sm">
          <span className="eyebrow">Last name (English)</span>
          <p>{profile.lastNameEn || "-"}</p>
        </div>
      </div>
      <div className="grid cols-3">
        <div className="stack-sm">
          <span className="eyebrow">Nationality</span>
          <p>{profile.nationality || "-"}</p>
        </div>
        <div className="stack-sm">
          <span className="eyebrow">Date of Birth</span>
          <p>{profile.dateOfBirth || "-"}</p>
        </div>
        <div className="stack-sm">
          <span className="eyebrow">Email</span>
          <p className="text-break-anywhere">{profile.email || "-"}</p>
        </div>
      </div>
      <AddressCard title="Term Time Address" value={profile.termTimeAddress} />
      <AddressCard title="Home Address" value={profile.homeAddress} />
      {hasSegmentation && segmentation ? (
        <section className="panel stack-sm">
          <span className="eyebrow">Student Segmentation</span>
          <div className="grid cols-3">
            <div className="stack-sm">
              <span className="eyebrow">{segmentation.labels.department}</span>
              <p>{segmentation.values.department || "-"}</p>
            </div>
            <div className="stack-sm">
              <span className="eyebrow">{segmentation.labels.pathway}</span>
              <p>{segmentation.values.pathway || "-"}</p>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
