"use client";

import AdminPageShell from "@/app/admin/_components/admin-page-shell";
import { useInformationChangeRequests } from "@/app/admin/information-requests/_hooks/use-information-change-requests";
import InformationChangeRequestsList from "@/app/admin/information-requests/_components/information-change-requests-list";

export default function AdminInformationRequestsPageClient() {
  const { loading, error, message, pendingId, rows, review } = useInformationChangeRequests();
  const pendingCount = rows.filter((item) => item.status === "PENDING").length;

  return (
    <AdminPageShell
      heroBadge="Admin / Information Requests"
      heroTitle="Information Change Requests"
      heroDescription="Students request email/address changes and admins approve or reject."
    >
      {error ? <p className="notice notice-error">{error}</p> : null}
      {message ? <p className="notice notice-info">{message}</p> : null}
      <section className="grid cols-3">
        <section className="metric stack-sm">
          <span className="eyebrow">Total Queue</span>
          <strong>{rows.length}</strong>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Pending Review</span>
          <strong>{pendingCount}</strong>
        </section>
        <section className="metric stack-sm">
          <span className="eyebrow">Review Guidance</span>
          <p className="muted">Approve only after validating requested email and address changes.</p>
        </section>
      </section>
      {loading ? <p className="notice notice-info">Loading requests...</p> : null}
      {!loading ? <InformationChangeRequestsList rows={rows} pendingId={pendingId} onReview={review} /> : null}
    </AdminPageShell>
  );
}
