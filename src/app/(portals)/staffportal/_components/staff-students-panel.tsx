"use client";

import type { StaffStudentRow } from "@/app/(portals)/staffportal/_types/staff-portal";

type StaffStudentsPanelProps = {
  rows: StaffStudentRow[];
  onSeeInformation: (row: StaffStudentRow) => void;
  pendingId?: string | null;
};

export default function StaffStudentsPanel({ rows, onSeeInformation, pendingId }: StaffStudentsPanelProps) {
  return (
    <section className="table-card stack">
      <span className="eyebrow">Student Information</span>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Student Number</th>
            <th>Department</th>
            <th>Pathway</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.studentNo || "-"}</td>
              <td>{row.department || "-"}</td>
              <td>{row.pathway || "-"}</td>
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
              <td colSpan={6}>No students available in your current permission scope.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
