import { History, Settings, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container flex min-h-20 items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-normal">Seedance Studio</h1>
            <p className="text-sm text-muted-foreground">Generación de vídeo con IA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="hidden sm:inline-flex">API proxy</Badge>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <History className="h-4 w-4" />
            Historial
          </Button>
          <ThemeToggle />
          <Button aria-label="Ajustes" variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
