"use client";

import AdminPageShell from "@/app/admin/_components/admin-page-shell";
import PasswordResetDialog from "@/app/admin/accounts/manage/_components/password-reset-dialog";
import AccountInfoDialog from "@/app/admin/accounts/manage/_components/account-info-dialog";
import AccountSearchBox from "@/app/admin/accounts/manage/_components/account-search-box";
import AccountRoleFilterTabs from "@/app/admin/accounts/manage/_components/account-role-filter-tabs";
import AccountManageFeedback from "@/app/admin/accounts/manage/_components/account-manage-feedback";
import AccountListTable from "@/app/admin/accounts/manage/_components/account-list-table";
import { useAccountManagePage } from "@/app/admin/accounts/manage/_hooks/use-account-manage-page";

export default function AdminManageAccountsPage() {
  const {
    roleFilter,
    setRoleFilter,
    roleFilterLabel,
    message,
    error,
    pendingId,
    setAppliedSearch,
    rows,
    page,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    dialogs,
    actions,
    actorUserId
  } = useAccountManagePage();

  return (
    <AdminPageShell
      shellClassName="app-shell-wide"
      heroBadge="Admin / Manage Accounts"
      heroTitle="Manage Accounts"
      heroDescription="Review account state, update status, and reset credentials."
    >
      <section className="management-toolbar">
        <AccountRoleFilterTabs roleFilter={roleFilter} onChange={setRoleFilter} />
        <AccountSearchBox roleFilter={roleFilter} onApplySearch={setAppliedSearch} />
      </section>
      <AccountManageFeedback message={message} error={error} />
      <AccountListTable
        roleFilterLabel={roleFilterLabel}
        rows={rows}
        selectedUserId={dialogs.infoTargetId ?? dialogs.passwordTarget?.userId ?? null}
        page={page}
        total={total}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onNextPage={goToNextPage}
        onPreviousPage={goToPreviousPage}
        pendingId={pendingId}
        onOpenInfo={(userId) => void actions.openInfo(userId)}
        onUpdateStatus={(userId, status) => void actions.updateStatus(userId, status)}
        onUpdateEnrollmentStatus={(userId, enrollmentStatus) => void actions.updateEnrollmentStatus(userId, enrollmentStatus)}
        onUpdateStaffTier={(userId, tier) => void actions.updateStaffTier(userId, tier)}
        onOpenPasswordDialog={dialogs.openPasswordDialog}
        onDelete={(userId) => void actions.deleteAccount(userId)}
      />

      <AccountInfoDialog
        open={Boolean(dialogs.infoTargetId)}
        pending={dialogs.infoPending || (dialogs.infoDetail ? pendingId === dialogs.infoDetail.id : false)}
        error={dialogs.infoError}
        account={dialogs.infoDetail}
        onUpdateStaffTier={async (userId, tier) => {
          await actions.updateStaffTier(userId, tier);
          if (dialogs.infoTargetId === userId) {
            await actions.openInfo(userId);
          }
        }}
        onUpdateSegmentation={(account, segmentation) => actions.updateSegmentation(account, segmentation)}
        onUpdateProfile={(account, profile) => actions.updateProfile(account, profile)}
        onClose={dialogs.closeInfoDialog}
      />

      <PasswordResetDialog
        open={Boolean(dialogs.passwordTarget)}
        loginId={dialogs.passwordTarget?.loginId ?? ""}
        requireCurrentPassword={Boolean(
          dialogs.passwordTarget && actorUserId && dialogs.passwordTarget.userId === actorUserId
        )}
        currentPasswordFieldError={dialogs.passwordCurrentFieldError}
        pending={pendingId === dialogs.passwordTarget?.userId}
        error={dialogs.passwordResetError}
        onClose={() => dialogs.closePasswordDialog(pendingId)}
        onSubmit={(payload) => actions.resetPassword(payload, dialogs.passwordTarget)}
      />
    </AdminPageShell>
  );
}
