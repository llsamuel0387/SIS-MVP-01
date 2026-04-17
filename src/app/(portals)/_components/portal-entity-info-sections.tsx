"use client";

import type { PortalEntityDetail } from "@/app/(portals)/_types/portal-my-information";

function AddressSection({
  title,
  value
}: {
  title: string;
  value: { country: string; addressLine1: string; addressLine2: string; postCode: string };
}) {
  const hasValue = Object.values(value).some((item) => item.length > 0);
  if (!hasValue) {
    return null;
  }

  return (
    <section className="panel stack-sm field-card">
      <span className="eyebrow">{title}</span>
      <p className="field-value">{value.country || "-"}</p>
      <p className="field-value">{value.addressLine1 || "-"}</p>
      {value.addressLine2 ? <p className="field-value">{value.addressLine2}</p> : null}
      <p className="muted">Post code: {value.postCode || "-"}</p>
    </section>
  );
}

export function PortalEntityIdentitySection({ detail }: { detail: PortalEntityDetail }) {
  const hasNumberField = detail.numberLabel.trim().length > 0;

  return (
    <section className="panel stack">
      <span className="eyebrow">Identity</span>
      <div className="identity-layout">
        <div className="identity-photo-wrap">
          {detail.photoDataUrl ? (
            <img className="profile-photo" src={detail.photoDataUrl} alt={`${detail.name} profile`} />
          ) : (
            <p className="muted">No profile photo.</p>
          )}
        </div>
        <div className="grid cols-2">
          <div className="stack-sm field-card">
            <span className="eyebrow">Name</span>
            <p className="field-value">{detail.name || "-"}</p>
          </div>
          {hasNumberField ? (
            <div className="stack-sm field-card">
              <span className="eyebrow">{detail.numberLabel}</span>
              <p className="field-value">{detail.numberValue || "-"}</p>
            </div>
          ) : null}
          <div className="stack-sm field-card">
            <span className="eyebrow">Role</span>
            <p className="field-value">{detail.roleLabel}</p>
          </div>
          <div className="stack-sm field-card">
            <span className="eyebrow">Status</span>
            <p className="field-value">{detail.status}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PortalEntityProfileSection({
  detail,
  showStudentOnlySections = true
}: {
  detail: PortalEntityDetail;
  showStudentOnlySections?: boolean;
}) {
  if (!detail.profile) {
    return null;
  }

  const canShowStudentOnly = showStudentOnlySections && detail.entityType === "STUDENT";

  return (
    <section className="panel stack">
      <span className="eyebrow">Profile</span>
      <div className="grid cols-2">
        <div className="stack-sm field-card">
          <span className="eyebrow">First name (Korean)</span>
          <p className="field-value">{detail.profile.firstNameKo || "-"}</p>
        </div>
        <div className="stack-sm field-card">
          <span className="eyebrow">Last name (Korean)</span>
          <p className="field-value">{detail.profile.lastNameKo || "-"}</p>
        </div>
      </div>
      <div className="grid cols-3">
        <div className="stack-sm field-card">
          <span className="eyebrow">First name (English)</span>
          <p className="field-value">{detail.profile.firstNameEn || "-"}</p>
        </div>
        <div className="stack-sm field-card">
          <span className="eyebrow">Middle name (English)</span>
          <p className="field-value">{detail.profile.middleNameEn || "-"}</p>
        </div>
        <div className="stack-sm field-card">
          <span className="eyebrow">Last name (English)</span>
          <p className="field-value">{detail.profile.lastNameEn || "-"}</p>
        </div>
      </div>
      <div className="grid cols-3">
        <div className="stack-sm field-card">
          <span className="eyebrow">Nationality</span>
          <p className="field-value">{detail.profile.nationality || "-"}</p>
        </div>
        <div className="stack-sm field-card">
          <span className="eyebrow">Date of Birth</span>
          <p className="field-value">{detail.profile.dateOfBirth || "-"}</p>
        </div>
        <div className="stack-sm field-card">
          <span className="eyebrow">Email</span>
          <p className="field-value">{detail.profile.email || "-"}</p>
        </div>
      </div>
      {canShowStudentOnly ? (
        <>
          <div className="grid cols-2">
            <div className="stack-sm field-card">
              <span className="eyebrow">Department</span>
              <p className="field-value">{detail.profile.department || "-"}</p>
            </div>
            <div className="stack-sm field-card">
              <span className="eyebrow">Pathway</span>
              <p className="field-value">{detail.profile.pathway || "-"}</p>
            </div>
          </div>
          {detail.profile.termTimeAddress ? <AddressSection title="Term Time Address" value={detail.profile.termTimeAddress} /> : null}
          {detail.profile.homeAddress ? <AddressSection title="Home Address" value={detail.profile.homeAddress} /> : null}
        </>
      ) : null}
    </section>
  );
}
