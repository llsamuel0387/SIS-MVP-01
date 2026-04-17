"use client";

import StaffEntityInfoDialog from "@/app/(portals)/staffportal/_components/staff-entity-info-dialog";
import StaffMembersPanel from "@/app/(portals)/staffportal/_components/staff-members-panel";
import { useStaffMembersPage } from "@/app/(portals)/staffportal/_hooks/use-staff-members-page";

export default function StaffMembersPage() {
  const { loading, error, canViewStaff, rows, dialogOpen, dialogError, detail, pendingId, openInformation, closeInformation } =
    useStaffMembersPage();

  if (loading) {
    return <p className="muted">Loading staff information...</p>;
  }

  return (
    <section className="stack">
      {error ? <p className="danger">{error}</p> : null}
      {!canViewStaff ? (
        <section className="panel">
          <p className="muted">Your current staff authority cannot access staff information.</p>
        </section>
      ) : (
        <StaffMembersPanel rows={rows} onSeeInformation={openInformation} pendingId={pendingId} />
      )}
      <StaffEntityInfoDialog open={dialogOpen} pending={Boolean(pendingId)} error={dialogError} detail={detail} onClose={closeInformation} />
    </section>
  );
}
