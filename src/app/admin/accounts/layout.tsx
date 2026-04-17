import { requireRolePageGuard } from "@/lib/server-route-guard";

export default async function AdminAccountsLayout({ children }: { children: React.ReactNode }) {
  await requireRolePageGuard("ADMIN", "/admin/login");

  return <>{children}</>;
}
