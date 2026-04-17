import { formatPermissionLabel, sortPermissionCodes } from "@/lib/permission-display";
import { formatCreateAccountRoleLabel } from "@/app/admin/accounts/create/_config/create-account-options";
import type { CreateAccountResponse } from "@/app/admin/accounts/create/_types/create-account";

type CreateAccountResultProps = {
  message: string;
  created: CreateAccountResponse | null;
};

export default function CreateAccountResult({ message, created }: CreateAccountResultProps) {
  const permissionLabels = created
    ? sortPermissionCodes(created.permissions).map((code) => formatPermissionLabel(code))
    : [];

  return (
    <>
      {message ? <p className="muted">{message}</p> : null}
      {created ? (
        <section className="table-card stack">
          <span className="eyebrow">Created Account</span>
          <div>Login ID: {created.loginId}</div>
          <div>Role: {formatCreateAccountRoleLabel(created.role)}</div>
          <div>Status: {created.status}</div>
          <div>Permissions: {permissionLabels.join(", ")}</div>
        </section>
      ) : null}
    </>
  );
}
