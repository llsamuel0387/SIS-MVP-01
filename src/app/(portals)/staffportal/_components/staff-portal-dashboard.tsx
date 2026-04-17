"use client";

import { useStaffPortalData } from "@/app/(portals)/staffportal/_hooks/use-staff-portal-data";
import StaffMyInformationPanel from "@/app/(portals)/staffportal/_components/staff-my-information-panel";

export default function StaffPortalDashboard() {
  const {
    loading,
    error,
    message,
    myInformation,
    myInformationError,
    myInformationLoading
  } = useStaffPortalData();

  if (loading) {
    return <p className="muted">Loading staff workspace...</p>;
  }

  return (
    <section className="stack">
      {error ? <p className="notice notice-error">{error}</p> : null}
      {message ? <p className="notice notice-info">{message}</p> : null}
      <section className="grid cols-3">
        <section className="metric stack-sm">
          <span className="eyebrow">Workspace Focus</span>
          <p className="muted">Review staff identity, access scope, and profile records.</p>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Data Security</span>
          <p className="muted">Sensitive fields are rendered only after server authorization checks.</p>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Next Step</span>
          <p className="muted">Use the left navigation to open student or staff review pages.</p>
        </section>
      </section>

      <StaffMyInformationPanel loading={myInformationLoading} error={myInformationError} detail={myInformation} />
    </section>
  );
}
