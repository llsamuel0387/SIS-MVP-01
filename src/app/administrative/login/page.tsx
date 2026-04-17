import { permanentRedirect } from "next/navigation";

export default function AdministrativeLoginRedirectPage() {
  permanentRedirect("/admin/login");
}
