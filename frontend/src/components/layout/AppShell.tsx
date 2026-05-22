import type { ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";
import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: ReactNode }) {
  useTheme();

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_32rem),radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.13),transparent_26rem),hsl(var(--background))]">
      <AppHeader />
      <main className="container py-6">{children}</main>
    </div>
  );
}
