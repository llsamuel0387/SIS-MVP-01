import InternalTopbar from "@/app/_components/internal-topbar";
import { HeroModule } from "@/ui/page-modules";
import type { ReactNode } from "react";
import { AppShell } from "@/ui/app-shell";

type PortalHomeShellProps = {
  title: string;
  links: Array<{ href: string; label: string }>;
  logoutRedirectPath: string;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  children?: ReactNode;
};

export default function PortalHomeShell({
  title,
  links,
  logoutRedirectPath,
  heroBadge,
  heroTitle,
  heroDescription,
  children
}: PortalHomeShellProps) {
  return (
    <AppShell>
      <section className="workspace-layout">
        <aside className="workspace-sidebar">
          <InternalTopbar title={title} links={links} logoutRedirectPath={logoutRedirectPath} />
        </aside>
        <section className="workspace-main">
          <HeroModule badge={heroBadge} title={heroTitle} description={heroDescription} />
          <section className="workspace-content">{children}</section>
        </section>
      </section>
    </AppShell>
  );
}
