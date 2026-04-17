import PortalLogin from "../../(public)/_components/portal-login";
import { ADMIN_LOGIN_CONFIG } from "@/app/(public)/_config/portal-login-config";

export default function AdminLoginPage() {
  return (
    <PortalLogin
      portalLabel={ADMIN_LOGIN_CONFIG.portalLabel}
      description={ADMIN_LOGIN_CONFIG.description}
      allowedRoles={[...ADMIN_LOGIN_CONFIG.allowedRoles]}
      successRedirectPath={ADMIN_LOGIN_CONFIG.successRedirectPath}
    />
  );
}
