"use client";

import type { PortalEntityDetail } from "@/app/(portals)/_types/portal-my-information";
import {
  PortalEntityIdentitySection,
  PortalEntityProfileSection
} from "@/app/(portals)/_components/portal-entity-info-sections";

type PortalMyInformationPanelProps = {
  loading: boolean;
  error: string;
  detail: PortalEntityDetail | null;
  description: string;
  showStudentOnlySections?: boolean;
};

export default function PortalMyInformationPanel({
  loading,
  error,
  detail,
  description,
  showStudentOnlySections = true
}: PortalMyInformationPanelProps) {
  return (
    <section className="stack">
      <section className="grid cols-2">
        <section className="panel stack-sm">
          <span className="eyebrow">My Information</span>
          <p className="muted">{description}</p>
        </section>
        <section className="panel stack-sm">
          <span className="eyebrow">Note</span>
          <p className="muted">Use Information Edit when profile updates are needed.</p>
        </section>
      </section>
      {loading ? <p className="notice notice-info">Loading my information...</p> : null}
      {error ? <p className="notice notice-error">{error}</p> : null}
      {detail ? (
        <>
          <PortalEntityIdentitySection detail={detail} />
          <PortalEntityProfileSection detail={detail} showStudentOnlySections={showStudentOnlySections} />
        </>
      ) : null}
    </section>
  );
}
