"use client";

import { getInformationRequestStatusLabel } from "@/lib/information-change-request";
import { InformationAddressCard } from "@/app/(portals)/_components/information-change-request-sections";
import type { InformationChangeRequestRow } from "@/lib/information-change-request-client";

type InformationChangeRequestsListProps = {
  rows: InformationChangeRequestRow[];
  pendingId: string | null;
  onReview: (requestId: string, decision: "APPROVE" | "REJECT") => void;
};

export default function InformationChangeRequestsList({ rows, pendingId, onReview }: InformationChangeRequestsListProps) {
  if (rows.length === 0) {
    return (
      <section className="panel">
        <p className="muted">No information change requests.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      {rows.map((item) => (
        <section key={item.id} className="panel stack">
          <div className="grid cols-2">
            <div className="stack">
              <div className="split-row">
                <div className="stack-sm">
                  <span className="eyebrow">Requester</span>
                  <strong>{item.requesterName}</strong>
                  <span className="muted">{item.requesterLoginId}</span>
                </div>
                <div className="stack-sm">
                  <span className="eyebrow">Status</span>
                  <strong>{getInformationRequestStatusLabel(item.status)}</strong>
                  <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="stack-sm field-card">
                <span className="eyebrow">Requested Email</span>
                <p className="text-break-anywhere">{item.requested.email || "-"}</p>
              </div>
              {item.requesterNote ? (
                <div className="stack-sm field-card">
                  <span className="eyebrow">Requester Note</span>
                  <p>{item.requesterNote}</p>
                </div>
              ) : null}
              {item.reviewerNote ? (
                <div className="stack-sm field-card">
                  <span className="eyebrow">Review Note</span>
                  <p>{item.reviewerNote}</p>
                </div>
              ) : null}
            </div>
            <div className="stack">
              <div className="grid cols-2">
                <InformationAddressCard title="Requested Term Time Address" value={item.requested.termTimeAddress} />
                <InformationAddressCard title="Requested Home Address" value={item.requested.homeAddress} />
              </div>
              {item.status === "PENDING" ? (
                <div className="inline-actions align-end">
                  <button
                    className="button secondary"
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => onReview(item.id, "REJECT")}
                  >
                    {pendingId === item.id ? "Processing..." : "Reject"}
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => onReview(item.id, "APPROVE")}
                  >
                    {pendingId === item.id ? "Processing..." : "Approve"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ))}
    </section>
  );
}
