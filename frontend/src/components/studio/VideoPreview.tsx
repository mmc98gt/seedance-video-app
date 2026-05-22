import { AlertCircle, Clock, Copy, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenerationFormValues, GenerationJob } from "@/types/generation.types";
import { EmptyPreview } from "./EmptyPreview";
import { GenerationActions } from "./GenerationActions";
import { GenerationStatus } from "./GenerationStatus";

interface VideoPreviewProps {
  job: GenerationJob | null;
  onReuse: (values: Partial<GenerationFormValues>) => void;
  onRetry: () => void;
}

export function VideoPreview({ job, onReuse, onRetry }: VideoPreviewProps) {
  const copyPrompt = async () => {
    if (!job?.request.prompt) return;
    await navigator.clipboard.writeText(job.request.prompt);
    toast.success("Prompt copiado.");
  };

  return (
    <Card className="border-white/10 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Estado, resultado y acciones del job activo.</CardDescription>
          </div>
          {job && <GenerationStatus status={job.status} progress={job.progress} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!job && <EmptyPreview />}
        {job && ["queued", "generating", "uploading", "validating"].includes(job.status) && (
          <div className="space-y-4">
            <Skeleton className="aspect-video min-h-64 w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              El servidor está procesando la generación. El polling se detendrá automáticamente al finalizar.
            </div>
          </div>
        )}
        {job?.status === "failed" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-destructive">La generación ha fallado</h3>
                  <p className="text-sm text-muted-foreground">{job.errorMessage ?? "Inténtalo de nuevo o revisa la configuración del backend."}</p>
                </div>
                <Button type="button" variant="outline" onClick={onRetry}>
                  <RefreshCcw className="h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            </div>
          </div>
        )}
        {job?.status === "completed" && (
          <div className="space-y-4">
            {job.videoUrl ? (
              <video className="aspect-video w-full rounded-lg border border-white/10 bg-black object-contain" src={job.videoUrl} poster={job.thumbnailUrl} controls />
            ) : (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">La API no devolvió una URL de vídeo válida.</div>
            )}
            <GenerationActions job={job} onReuse={() => onReuse(job.request)} />
          </div>
        )}
        {job && (
          <>
            <Separator />
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3"><span>Modelo</span><strong className="text-foreground">{job.request.model}</strong></div>
              <div className="flex items-center justify-between gap-3"><span>Duración</span><strong className="text-foreground">{job.request.duration}s</strong></div>
              <div className="flex items-center justify-between gap-3"><span>Formato</span><strong className="text-foreground">{job.request.resolution} · {job.request.aspectRatio}</strong></div>
              <div className="flex items-center justify-between gap-3"><span>Fecha</span><strong className="text-foreground">{new Date(job.createdAt).toLocaleString()}</strong></div>
            </div>
            <Button type="button" variant="ghost" className="w-full" onClick={copyPrompt}>
              <Copy className="h-4 w-4" />
              Copiar prompt
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
