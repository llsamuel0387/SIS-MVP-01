import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return <main className={cn("app-shell", className)}>{children}</main>;
}
