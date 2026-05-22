import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function Sidebar({ children }: { children: ReactNode }) {
  return <Card className="border-white/10 bg-card/80 p-5 backdrop-blur">{children}</Card>;
}
