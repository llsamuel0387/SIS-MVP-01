"use client";

import PortalMyInformationPanel from "@/app/(portals)/_components/portal-my-information-panel";
import { useStudentPortalData } from "@/app/(portals)/studentportal/_hooks/use-student-portal-data";

export default function StudentPortalDashboard() {
  const { loading, error, myInformation } = useStudentPortalData();

  return (
    <section className="stack">
      <section className="grid cols-3">
        <section className="metric stack-sm">
          <span className="eyebrow">My Profile Hub</span>
          <p className="muted">View the core profile data linked to your student account.</p>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Update Flow</span>
          <p className="muted">Submit change requests in Information Edit and wait for admin approval.</p>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Privacy Guard</span>
          <p className="muted">Access to other users&apos; data is blocked by server policy.</p>
        </section>
      </section>
      <PortalMyInformationPanel
        loading={loading}
        error={error}
        detail={myInformation}
        description="Personal profile data assigned to your current student account."
        showStudentOnlySections
      />
    </section>
  );
}
