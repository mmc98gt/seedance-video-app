import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import type { ThemePreference } from "@/stores/theme.store";

const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "dark", label: "Oscuro" },
  { value: "light", label: "Claro" },
  { value: "system", label: "Sistema" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Cambiar tema" variant="outline" size="icon">
                <Icon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Cambiar tema</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          {OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem key={option.value} checked={theme === option.value} onCheckedChange={() => setTheme(option.value)}>
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
