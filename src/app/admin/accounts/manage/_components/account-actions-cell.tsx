"use client";

import type { AccountRow } from "@/lib/admin-accounts-client";
import { Button } from "@/components/ui/button";

type AccountActionsCellProps = {
  row: AccountRow;
  pending: boolean;
  onOpenInfo: (userId: string) => void;
  onUpdateStatus: (userId: string, status: "ACTIVE" | "INACTIVE") => void;
  onOpenPasswordDialog: (userId: string, loginId: string) => void;
  onDelete: (userId: string) => void;
};

export default function AccountActionsCell({
  row,
  pending,
  onOpenInfo,
  onUpdateStatus,
  onOpenPasswordDialog,
  onDelete
}: AccountActionsCellProps) {
  return (
    <td className="account-grid-actions-cell">
      <div className="account-grid-actions">
        <Button
          className="account-grid-action-button"
          variant="outline"
          size="sm"
          type="button"
          onClick={() => onOpenInfo(row.id)}
          disabled={pending}
        >
          Details
        </Button>
        {row.status === "ACTIVE" ? (
          <Button
            className="account-grid-action-button"
            variant="outline"
            size="sm"
            type="button"
            disabled={pending}
            onClick={() => onUpdateStatus(row.id, "INACTIVE")}
          >
            Disable
          </Button>
        ) : (
          <Button
            className="account-grid-action-button"
            variant="outline"
            size="sm"
            type="button"
            disabled={pending}
            onClick={() => onUpdateStatus(row.id, "ACTIVE")}
          >
            Enable
          </Button>
        )}
        <Button
          className="account-grid-action-button"
          variant="outline"
          size="sm"
          type="button"
          disabled={pending}
          onClick={() => onOpenPasswordDialog(row.id, row.loginId)}
        >
          Reset PW
        </Button>
        <Button
          className="account-grid-action-button account-grid-action-button-danger"
          variant="outline"
          size="sm"
          type="button"
          disabled={pending}
          onClick={() => onDelete(row.id)}
        >
          Delete
        </Button>
      </div>
    </td>
  );
}
