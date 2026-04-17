import PortalLogin from "../../_components/portal-login";
import { STUDENT_LOGIN_CONFIG } from "@/app/(public)/_config/portal-login-config";

export default function StudentPortalLoginPage() {
  return (
    <PortalLogin
      portalLabel={STUDENT_LOGIN_CONFIG.portalLabel}
      description={STUDENT_LOGIN_CONFIG.description}
      allowedRoles={[...STUDENT_LOGIN_CONFIG.allowedRoles]}
      successRedirectPath={STUDENT_LOGIN_CONFIG.successRedirectPath}
    />
  );
}
