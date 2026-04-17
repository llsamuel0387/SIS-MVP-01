import type { ReactNode } from "react";
import InternalTopbar from "@/app/_components/internal-topbar";
import { HeroModule } from "@/ui/page-modules";
import { AppShell } from "@/ui/app-shell";
import {
  ADMIN_NAV_LINKS,
  ADMIN_NAV_LINKS_WITH_SSO,
  ADMIN_NAV_TITLE
} from "@/app/admin/_config/admin-navigation";

type AdminPageShellProps = {
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  includeSsoLink?: boolean;
  children: ReactNode;
};

export default function AdminPageShell({
  heroBadge,
  heroTitle,
  heroDescription,
  includeSsoLink = false,
  children
}: AdminPageShellProps) {
  return (
    <AppShell>
      <section className="workspace-layout">
        <aside className="workspace-sidebar">
          <InternalTopbar title={ADMIN_NAV_TITLE} links={includeSsoLink ? [...ADMIN_NAV_LINKS_WITH_SSO] : [...ADMIN_NAV_LINKS]} />
        </aside>
        <section className="workspace-main">
          <HeroModule badge={heroBadge} title={heroTitle} description={heroDescription} />
          <section className="workspace-content">{children}</section>
        </section>
      </section>
    </AppShell>
  );
}
