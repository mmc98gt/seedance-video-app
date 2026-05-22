import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { GenerationStatus as Status } from "@/types/generation.types";

const STATUS_LABELS: Record<Status, string> = {
  idle: "Sin trabajo activo",
  validating: "Validando",
  uploading: "Subiendo imagen",
  queued: "En cola",
  generating: "Generando",
  completed: "Completado",
  failed: "Error",
  cancelled: "Cancelado",
};

export function GenerationStatus({ status, progress }: { status: Status; progress?: number }) {
  const variant = status === "completed" ? "success" : status === "failed" || status === "cancelled" ? "destructive" : "secondary";
  const value = progress ?? (status === "generating" ? 45 : status === "queued" ? 15 : status === "completed" ? 100 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>
        <span className="text-xs text-muted-foreground">{value > 0 ? `${value}%` : "Listo"}</span>
      </div>
      {status !== "idle" && <Progress value={value} />}
    </div>
  );
}
