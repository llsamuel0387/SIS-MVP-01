"use client";

import StaffEntityInfoDialog from "@/app/(portals)/staffportal/_components/staff-entity-info-dialog";
import StaffStudentsPanel from "@/app/(portals)/staffportal/_components/staff-students-panel";
import { useStaffStudentsPage } from "@/app/(portals)/staffportal/_hooks/use-staff-students-page";

export default function StaffStudentsPage() {
  const {
    loading,
    error,
    canViewStudents,
    rows,
    page,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    dialogOpen,
    dialogError,
    detail,
    pendingId,
    openInformation,
    closeInformation
  } = useStaffStudentsPage();

  if (loading) {
    return <p className="muted">Loading student information...</p>;
  }

  return (
    <section className="stack">
      {error ? <p className="notice notice-error">{error}</p> : null}
      <section className="grid cols-3">
        <section className="metric stack-sm">
          <span className="eyebrow">Visible Students</span>
          <strong>{total}</strong>
          <p className="muted">Students currently visible to this account.</p>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Access Scope</span>
          <p className="muted">Records are filtered server-side based on permission policy.</p>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Action</span>
          <p className="muted">Open detailed records using the row action button.</p>
        </section>
      </section>
      {!canViewStudents ? (
        <section className="panel">
          <p className="muted">Your current staff authority cannot access student information.</p>
        </section>
      ) : (
        <StaffStudentsPanel
          rows={rows}
          page={page}
          total={total}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
          onSeeInformation={openInformation}
          pendingId={pendingId}
        />
      )}
      <StaffEntityInfoDialog open={dialogOpen} pending={Boolean(pendingId)} error={dialogError} detail={detail} onClose={closeInformation} />
    </section>
  );
}
