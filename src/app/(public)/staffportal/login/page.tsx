import PortalLogin from "../../_components/portal-login";
import { STAFF_LOGIN_CONFIG } from "@/app/(public)/_config/portal-login-config";

export default function StaffPortalLoginPage() {
  return (
    <PortalLogin
      portalLabel={STAFF_LOGIN_CONFIG.portalLabel}
      description={STAFF_LOGIN_CONFIG.description}
      allowedRoles={[...STAFF_LOGIN_CONFIG.allowedRoles]}
      successRedirectPath={STAFF_LOGIN_CONFIG.successRedirectPath}
    />
  );
}
