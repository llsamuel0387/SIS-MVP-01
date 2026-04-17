import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HeroModuleProps = {
  badge: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

export function HeroModule({ badge, title, description, children }: HeroModuleProps) {
  return (
    <Card className="hero-module-card">
      <CardHeader className="hero-module-header">
        <Badge variant="secondary" className="hero-module-badge">
          {badge}
        </Badge>
        <div className="stack-sm">
          <CardTitle className="hero-module-title">{title}</CardTitle>
          {description ? <p className="hero-module-description">{description}</p> : null}
        </div>
      </CardHeader>
      {children ? (
        <CardContent className="hero-module-content">
          <div className="stack-sm">
            <span className="eyebrow">Overview & Actions</span>
            {children}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

type ActionRowProps = {
  children: ReactNode;
};

export function ActionRow({ children }: ActionRowProps) {
  return <section className="actions-row">{children}</section>;
}

type SplitRowProps = {
  children: ReactNode;
};

export function SplitRow({ children }: SplitRowProps) {
  return <div className="split-row">{children}</div>;
}
