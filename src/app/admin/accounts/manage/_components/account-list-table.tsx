import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StaffTierCode } from "@/lib/permissions";
import type { AccountRow } from "@/lib/admin-accounts-client";
import { STAFF_TIER_OPTIONS, getStaffTierLabel } from "@/app/admin/accounts/_config/staff-tier-options";
import AccountActionsCell from "@/app/admin/accounts/manage/_components/account-actions-cell";

type AccountListTableProps = {
  roleFilterLabel: string;
  rows: AccountRow[];
  selectedUserId?: string | null;
  page: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  pendingId: string | null;
  onOpenInfo: (userId: string) => void;
  onUpdateStatus: (userId: string, status: "ACTIVE" | "INACTIVE") => void;
  onUpdateEnrollmentStatus: (userId: string, enrollmentStatus: "ENROLLED" | "NOT_ENROLLED") => void;
  onUpdateStaffTier: (userId: string, staffTier: StaffTierCode) => void;
  onOpenPasswordDialog: (userId: string, loginId: string) => void;
  onDelete: (userId: string) => void;
};

function getRoleLabel(role: AccountRow["role"]) {
  if (role === "STUDENT") {
    return "Student";
  }
  if (role === "STAFF") {
    return "Staff";
  }
  return "Admin";
}

function getRoleBadgeClass(role: AccountRow["role"]) {
  if (role === "STUDENT") {
    return "account-grid-role-badge-student";
  }
  if (role === "STAFF") {
    return "account-grid-role-badge-staff";
  }
  return "account-grid-role-badge-admin";
}

function getStatusBadgeClass(status: AccountRow["status"]) {
  return status === "ACTIVE" ? "account-grid-status-badge-active" : "account-grid-status-badge-inactive";
}

export default function AccountListTable({
  roleFilterLabel,
  rows,
  selectedUserId,
  page,
  total,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  pendingId,
  onOpenInfo,
  onUpdateStatus,
  onUpdateEnrollmentStatus,
  onUpdateStaffTier,
  onOpenPasswordDialog,
  onDelete
}: AccountListTableProps) {
  return (
    <Card className="account-grid-card">
      <CardContent className="stack account-grid-card-content">
        <div className="split-row">
          <div className="stack-xs">
            <span className="eyebrow">{roleFilterLabel} Accounts</span>
            <p className="muted">
              {total} records · page {page} of {totalPages}
            </p>
          </div>
          <p className="muted account-grid-summary-note">
            Compact operations view for account review, access updates, and credential resets.
          </p>
        </div>
        <p className="muted stack-xs">
          INACTIVE accounts (including automatic lockout after repeated failed logins) can sign in again after an administrator
          clicks <strong>Activate</strong> in this list. Self-service email unlock is not available yet.
        </p>
        <div className="table-wrap account-grid-wrap">
          <table className="table account-grid-table">
            <colgroup>
              <col className="account-grid-col-name" />
              <col className="account-grid-col-login" />
              <col className="account-grid-col-role" />
              <col className="account-grid-col-status" />
              <col className="account-grid-col-control" />
              <col className="account-grid-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Name</th>
                <th>Login ID</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Tier / Enrolment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  data-pending={pendingId === row.id ? "true" : "false"}
                  data-selected={selectedUserId === row.id ? "true" : "false"}
                >
                  <td className="account-grid-name-cell">
                    <span className="account-grid-name" title={row.name}>
                      {row.name}
                    </span>
                  </td>
                  <td className="account-grid-login-cell">
                    <span className="account-grid-login" title={row.loginId}>
                      {row.loginId}
                    </span>
                  </td>
                  <td>
                    <Badge variant="outline" className={`account-grid-role-badge ${getRoleBadgeClass(row.role)}`}>
                      {getRoleLabel(row.role)}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant="outline" className={`account-grid-status-badge ${getStatusBadgeClass(row.status)}`}>
                      {row.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="account-grid-control-cell">
                    {row.role === "STUDENT" ? (
                      <select
                        className="account-grid-select"
                        value={row.enrollmentStatus ?? "NOT_ENROLLED"}
                        disabled={pendingId === row.id}
                        onChange={(event) =>
                          onUpdateEnrollmentStatus(row.id, event.target.value as "ENROLLED" | "NOT_ENROLLED")
                        }
                      >
                        <option value="ENROLLED">Enrolled</option>
                        <option value="NOT_ENROLLED">Not enrolled</option>
                      </select>
                    ) : null}
                    {row.role === "STAFF" ? (
                      <select
                        className="account-grid-select"
                        value={row.staffTier ?? "STAFF"}
                        disabled={pendingId === row.id}
                        onChange={(event) => onUpdateStaffTier(row.id, event.target.value as StaffTierCode)}
                      >
                        {STAFF_TIER_OPTIONS.map((tier) => (
                          <option key={tier} value={tier}>
                            {getStaffTierLabel(tier)}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {row.role === "ADMIN" ? <span className="account-grid-empty">System authority</span> : null}
                  </td>
                  <AccountActionsCell
                    row={row}
                    pending={pendingId === row.id}
                    onOpenInfo={onOpenInfo}
                    onUpdateStatus={onUpdateStatus}
                    onOpenPasswordDialog={onOpenPasswordDialog}
                    onDelete={onDelete}
                  />
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted account-grid-empty-row">
                    No accounts found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm account-grid-pagination">
          <span className="muted">
            Page {page} of {totalPages} · {total} accounts
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
      </CardContent>
    </Card>
  );
}
