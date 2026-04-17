"use client";

import type { StaffEntityDetail } from "@/app/(portals)/staffportal/_types/staff-portal";
import {
  StaffEntityIdentitySection,
  StaffEntityProfileSection
} from "@/app/(portals)/staffportal/_components/staff-entity-info-sections";

type StaffEntityInfoDialogProps = {
  open: boolean;
  pending: boolean;
  error: string;
  detail: StaffEntityDetail | null;
  onClose: () => void;
};

export default function StaffEntityInfoDialog({ open, pending, error, detail, onClose }: StaffEntityInfoDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel stack" role="dialog" aria-modal="true" aria-label="Information detail">
        <div className="split-row">
          <span className="eyebrow">See Information</span>
          <button className="button secondary" type="button" onClick={onClose} disabled={pending}>
            Close
          </button>
        </div>

        {pending ? <p className="muted">Loading...</p> : null}
        {error ? <p className="danger">{error}</p> : null}

        {detail ? (
          <section className="stack">
            <StaffEntityIdentitySection detail={detail} />
            <StaffEntityProfileSection detail={detail} />
          </section>
        ) : null}
      </section>
    </div>
  );
}
