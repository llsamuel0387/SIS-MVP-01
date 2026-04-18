"use client";

import { getStaffTierLabel } from "@/app/admin/accounts/_config/staff-tier-options";
import type { StaffMemberRow } from "@/app/(portals)/staffportal/_types/staff-portal";

type StaffMembersPanelProps = {
  rows: StaffMemberRow[];
  page: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onSeeInformation: (row: StaffMemberRow) => void;
  pendingId?: string | null;
};

export default function StaffMembersPanel({
  rows,
  page,
  total,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  onSeeInformation,
  pendingId
}: StaffMembersPanelProps) {
  return (
    <section className="table-card stack">
      <span className="eyebrow">Staff Information</span>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Staff Number</th>
            <th>Tier</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.staffNo || "-"}</td>
              <td>{getStaffTierLabel(row.staffTier)}</td>
              <td>{row.department || "-"}</td>
              <td>{row.status}</td>
              <td>
                <button className="button secondary" type="button" onClick={() => onSeeInformation(row)} disabled={pendingId === row.id}>
                  {pendingId === row.id ? "Loading..." : "See Information"}
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6}>No staff records available in your current permission scope.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="muted">
          Page {page} of {totalPages} · {total} staff records
        </span>
        <div className="flex gap-2">
          <button className="button secondary" type="button" onClick={onPreviousPage} disabled={!hasPreviousPage}>
            Previous
          </button>
          <button className="button secondary" type="button" onClick={onNextPage} disabled={!hasNextPage}>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
