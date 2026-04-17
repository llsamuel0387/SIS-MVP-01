import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/ui/app-shell";
import { ActionRow, HeroModule } from "@/ui/page-modules";
import { PUBLIC_PORTAL_LINKS } from "@/app/_config/public-portal-links";

export default function HomePage() {
  return (
    <AppShell>
      <HeroModule badge="Student Information System Demo" title="Student Information System Demo" />

      <ActionRow>
        {PUBLIC_PORTAL_LINKS.map((portal) => (
          <Link key={portal.href} href={portal.href}>
            <Button variant={portal.variant === "primary" ? "default" : "outline"}>{portal.label}</Button>
          </Link>
        ))}
      </ActionRow>

    </AppShell>
  );
}
