import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActionRow } from "@/ui/page-modules";
import { ADMIN_DASHBOARD_ACTIONS } from "@/app/admin/_config/admin-dashboard-actions";

export default function AdminDashboardActions() {
  return (
    <ActionRow>
      {ADMIN_DASHBOARD_ACTIONS.map((action) => (
        <Link key={action.href} href={action.href}>
          <Button variant={action.variant === "primary" ? "default" : "outline"}>{action.label}</Button>
        </Link>
      ))}
    </ActionRow>
  );
}
