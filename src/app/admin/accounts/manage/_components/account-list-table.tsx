import { Card, CardContent } from "@/components/ui/card";
import type { StaffTierCode } from "@/lib/permissions";
import type { AccountRow } from "@/lib/admin-accounts-client";
import AccountActionsCell from "@/app/admin/accounts/manage/_components/account-actions-cell";

type AccountListTableProps = {
  roleFilterLabel: string;
  rows: AccountRow[];
  pendingId: string | null;
  onOpenInfo: (userId: string) => void;
  onUpdateStatus: (userId: string, status: "ACTIVE" | "INACTIVE") => void;
  onUpdateEnrollmentStatus: (userId: string, enrollmentStatus: "ENROLLED" | "NOT_ENROLLED") => void;
  onUpdateStaffTier: (userId: string, staffTier: StaffTierCode) => void;
  onOpenPasswordDialog: (userId: string, loginId: string) => void;
  onDelete: (userId: string) => void;
};

export default function AccountListTable({
  roleFilterLabel,
  rows,
  pendingId,
  onOpenInfo,
  onUpdateStatus,
  onUpdateEnrollmentStatus,
  onUpdateStaffTier,
  onOpenPasswordDialog,
  onDelete
}: AccountListTableProps) {
  return (
    <Card>
      <CardContent className="stack">
        <span className="eyebrow">{roleFilterLabel} Accounts</span>
        <p className="muted stack-xs">
          INACTIVE accounts (including automatic lockout after repeated failed logins) can sign in again after an administrator
          clicks <strong>Activate</strong> in this list. Self-service email unlock is not available yet.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Login ID</th>
                <th>Account Status</th>
                <th>Enrolment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.name}</td>
                  <td>{row.loginId}</td>
                  <td>{row.status}</td>
                  <td>{row.role === "STUDENT" ? row.enrollmentStatus ?? "NOT_ENROLLED" : "-"}</td>
                  <AccountActionsCell
                    row={row}
                    pending={pendingId === row.id}
                    onOpenInfo={onOpenInfo}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateEnrollmentStatus={onUpdateEnrollmentStatus}
                    onUpdateStaffTier={onUpdateStaffTier}
                    onOpenPasswordDialog={onOpenPasswordDialog}
                    onDelete={onDelete}
                  />
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No accounts found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
