"use client";

import type { StaffTierCode } from "@/lib/permissions";
import type { AccountRow } from "@/lib/admin-accounts-client";
import { STAFF_TIER_OPTIONS, getStaffTierLabel } from "@/app/admin/accounts/_config/staff-tier-options";
import { Button } from "@/components/ui/button";

type AccountActionsCellProps = {
  row: AccountRow;
  pending: boolean;
  onOpenInfo: (userId: string) => void;
  onUpdateStatus: (userId: string, status: "ACTIVE" | "INACTIVE") => void;
  onUpdateEnrollmentStatus: (userId: string, enrollmentStatus: "ENROLLED" | "NOT_ENROLLED") => void;
  onUpdateStaffTier: (userId: string, staffTier: StaffTierCode) => void;
  onOpenPasswordDialog: (userId: string, loginId: string) => void;
  onDelete: (userId: string) => void;
};

export default function AccountActionsCell({
  row,
  pending,
  onOpenInfo,
  onUpdateStatus,
  onUpdateEnrollmentStatus,
  onUpdateStaffTier,
  onOpenPasswordDialog,
  onDelete
}: AccountActionsCellProps) {
  const currentEnrollmentStatus = row.enrollmentStatus ?? "NOT_ENROLLED";
  const currentStaffTier = row.staffTier ?? "STAFF";

  return (
    <td className="inline-actions">
      <Button variant="outline" size="sm" type="button" onClick={() => onOpenInfo(row.id)} disabled={pending}>
        See Information
      </Button>
      {row.role === "STUDENT" ? (
        <label className="stack-xs">
          <span className="eyebrow">Enrolment</span>
          <select
            value={currentEnrollmentStatus}
            disabled={pending}
            onChange={(event) => onUpdateEnrollmentStatus(row.id, event.target.value as "ENROLLED" | "NOT_ENROLLED")}
          >
            <option value="ENROLLED">Enrolled</option>
            <option value="NOT_ENROLLED">Not Enrolled</option>
          </select>
        </label>
      ) : null}
      {row.role === "STAFF" ? (
        <label className="stack-xs">
          <span className="eyebrow">Staff tier</span>
          <select
            value={currentStaffTier}
            disabled={pending}
            onChange={(event) => onUpdateStaffTier(row.id, event.target.value as StaffTierCode)}
          >
            {STAFF_TIER_OPTIONS.map((tier) => (
              <option key={tier} value={tier}>
                {getStaffTierLabel(tier)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {row.status === "ACTIVE" ? (
        <Button variant="outline" size="sm" type="button" disabled={pending} onClick={() => onUpdateStatus(row.id, "INACTIVE")}>
          Deactivate
        </Button>
      ) : (
        <Button variant="outline" size="sm" type="button" disabled={pending} onClick={() => onUpdateStatus(row.id, "ACTIVE")}>
          Activate
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        type="button"
        disabled={pending}
        onClick={() => onOpenPasswordDialog(row.id, row.loginId)}
      >
        Password
      </Button>
      <Button variant="outline" size="sm" type="button" disabled={pending} onClick={() => onDelete(row.id)}>
        Delete
      </Button>
    </td>
  );
}
